from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database.database import get_db
from app.models.raw_material import RawMaterial, Warehouse
from app.models.inventory import InventoryTransaction, StockAlert
from app.schemas.raw_material import (
    RawMaterialCreate, RawMaterialUpdate, RawMaterialResponse,
    WarehouseCreate, WarehouseUpdate, WarehouseResponse,
    InventoryTransactionCreate
)
from app.core.dependencies import get_current_user, require_inventory
from app.models.user import User
from app.utils.response import success_response, paginated_response
import qrcode
import barcode
from barcode.writer import ImageWriter
import io, base64, os
from datetime import datetime

router = APIRouter(prefix="/inventory", tags=["Inventory & Raw Materials"])


@router.get("/raw-materials", response_model=dict)
async def get_raw_materials(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    leather_type: Optional[str] = None,
    grade: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RawMaterial).filter(RawMaterial.deleted_at == None, RawMaterial.is_active == True)

    if search:
        query = query.filter(
            RawMaterial.name.ilike(f"%{search}%") | RawMaterial.code.ilike(f"%{search}%")
        )
    if leather_type:
        query = query.filter(RawMaterial.leather_type == leather_type)
    if grade:
        query = query.filter(RawMaterial.grade == grade)
    if warehouse_id:
        query = query.filter(RawMaterial.warehouse_id == warehouse_id)
    if low_stock:
        query = query.filter(RawMaterial.current_stock <= RawMaterial.reorder_point)

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        data=[RawMaterialResponse.from_orm(i).dict() for i in items],
        total=total, page=page, limit=limit
    )


@router.post("/raw-materials", response_model=dict)
async def create_raw_material(
    data: RawMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generate barcode and QR
    code = data.code or f"RM{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    material = RawMaterial(**data.dict())
    material.code = code
    db.add(material)
    db.commit()
    db.refresh(material)

    # Check stock alert
    _check_stock_alerts(db, material)

    return success_response(data=RawMaterialResponse.from_orm(material).dict(), message="Raw material created")


@router.get("/raw-materials/{material_id}", response_model=dict)
async def get_raw_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    material = db.query(RawMaterial).filter(RawMaterial.id == material_id, RawMaterial.deleted_at == None).first()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")
    return success_response(data=RawMaterialResponse.from_orm(material).dict())


@router.put("/raw-materials/{material_id}", response_model=dict)
async def update_raw_material(
    material_id: int,
    data: RawMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    material = db.query(RawMaterial).filter(RawMaterial.id == material_id, RawMaterial.deleted_at == None).first()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(material, key, value)
    db.commit()
    db.refresh(material)
    _check_stock_alerts(db, material)
    return success_response(data=RawMaterialResponse.from_orm(material).dict(), message="Updated successfully")


@router.delete("/raw-materials/{material_id}", response_model=dict)
async def delete_raw_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    material = db.query(RawMaterial).filter(RawMaterial.id == material_id, RawMaterial.deleted_at == None).first()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")
    material.deleted_at = datetime.utcnow()
    db.commit()
    return success_response(message="Raw material deleted")


@router.post("/raw-materials/{material_id}/stock-adjust", response_model=dict)
async def adjust_stock(
    material_id: int,
    data: InventoryTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    material = db.query(RawMaterial).filter(RawMaterial.id == material_id, RawMaterial.deleted_at == None).first()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")

    transaction = InventoryTransaction(
        raw_material_id=material_id,
        warehouse_id=data.warehouse_id or material.warehouse_id,
        transaction_type=data.transaction_type,
        quantity=data.quantity,
        unit_price=data.unit_price or material.unit_price,
        total_value=(data.unit_price or material.unit_price) * data.quantity,
        reference_number=data.reference_number,
        notes=data.notes,
        created_by=current_user.id,
        transaction_number=f"TXN{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    )
    db.add(transaction)

    # Update stock
    if data.transaction_type in ["purchase", "return_stock"]:
        material.current_stock += data.quantity
    elif data.transaction_type in ["consumption", "wastage", "transfer"]:
        if material.current_stock < data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        material.current_stock -= data.quantity

    db.commit()
    _check_stock_alerts(db, material)
    return success_response(message="Stock adjusted successfully")


@router.get("/warehouses", response_model=dict)
async def get_warehouses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    warehouses = db.query(Warehouse).all()
    return success_response(data=[WarehouseResponse.from_orm(w).dict() for w in warehouses])


@router.post("/warehouses", response_model=dict)
async def create_warehouse(
    data: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Warehouse).count()
    warehouse = Warehouse(**data.dict(), code=f"WH{str(count + 1).zfill(3)}")
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return success_response(data=WarehouseResponse.from_orm(warehouse).dict(), message="Warehouse created")


@router.put("/warehouses/{warehouse_id}", response_model=dict)
async def update_warehouse(
    warehouse_id: int,
    data: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(warehouse, key, value)
    
    db.commit()
    db.refresh(warehouse)
    return success_response(data=WarehouseResponse.from_orm(warehouse).dict(), message="Warehouse updated successfully")


@router.delete("/warehouses/{warehouse_id}", response_model=dict)
async def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    warehouse.is_active = False
    db.commit()
    return success_response(message="Warehouse deleted successfully")


@router.get("/stock-alerts", response_model=dict)
async def get_stock_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alerts = db.query(StockAlert).filter(StockAlert.is_resolved == False).all()
    return success_response(data=[{
        "id": a.id,
        "raw_material_id": a.raw_material_id,
        "alert_type": a.alert_type,
        "current_stock": a.current_stock,
        "threshold": a.threshold,
        "message": a.message,
        "created_at": a.created_at
    } for a in alerts])


@router.get("/transactions", response_model=dict)
async def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    material_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryTransaction)
    if material_id:
        query = query.filter(InventoryTransaction.raw_material_id == material_id)
    total = query.count()
    items = query.order_by(InventoryTransaction.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return paginated_response(
        data=[{
            "id": t.id,
            "transaction_number": t.transaction_number,
            "raw_material_id": t.raw_material_id,
            "transaction_type": t.transaction_type,
            "quantity": t.quantity,
            "total_value": t.total_value,
            "created_at": t.created_at
        } for t in items],
        total=total, page=page, limit=limit
    )


def _check_stock_alerts(db: Session, material: RawMaterial):
    """Check and create stock alerts for a material."""
    if material.current_stock <= 0:
        alert_type = "out_of_stock"
        message = f"{material.name} is OUT OF STOCK"
    elif material.current_stock <= material.minimum_stock:
        alert_type = "low_stock"
        message = f"{material.name} has LOW STOCK: {material.current_stock} {material.unit}"
    else:
        return

    existing = db.query(StockAlert).filter(
        StockAlert.raw_material_id == material.id,
        StockAlert.alert_type == alert_type,
        StockAlert.is_resolved == False
    ).first()

    if not existing:
        alert = StockAlert(
            raw_material_id=material.id,
            alert_type=alert_type,
            current_stock=material.current_stock,
            threshold=material.minimum_stock,
            message=message
        )
        db.add(alert)
        db.commit()

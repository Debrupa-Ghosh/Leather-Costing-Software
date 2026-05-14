from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database.database import get_db
from app.models.product import Product, ProductCosting
from app.models.bom import BOM, BOMItem
from app.models.raw_material import RawMaterial
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.response import success_response, paginated_response
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/products", tags=["Products & Costing"])


class ProductCreate(BaseModel):
    sku: Optional[str] = None
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    unit: str = "piece"
    selling_price: float = 0.0
    weight: Optional[float] = None
    tags: Optional[List[str]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    selling_price: Optional[float] = None
    weight: Optional[float] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class CostingCreate(BaseModel):
    product_id: int
    leather_cost: float = 0.0
    accessories_cost: float = 0.0
    labor_cost: float = 0.0
    machine_cost: float = 0.0
    electricity_cost: float = 0.0
    overhead_cost: float = 0.0
    packaging_cost: float = 0.0
    transportation_cost: float = 0.0
    tax_percentage: float = 0.0
    profit_margin_percentage: float = 20.0
    notes: Optional[str] = None


class BOMItemCreate(BaseModel):
    raw_material_id: int
    quantity: float
    unit: Optional[str] = None
    wastage_percentage: float = 5.0


class BOMCreate(BaseModel):
    product_id: int
    description: Optional[str] = None
    items: List[BOMItemCreate]


@router.get("/", response_model=dict)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product).filter(Product.deleted_at == None, Product.is_active == True)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    if category:
        query = query.filter(Product.category == category)
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return paginated_response(
        data=[{
            "id": p.id, "sku": p.sku, "name": p.name,
            "category": p.category, "selling_price": p.selling_price,
            "unit": p.unit, "is_active": p.is_active, "created_at": p.created_at
        } for p in items],
        total=total, page=page, limit=limit
    )


@router.post("/", response_model=dict)
async def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Product).count()
    sku = data.sku or f"LF-PROD-{str(count + 1).zfill(4)}"

    product = Product(
        sku=sku, name=data.name, category=data.category,
        description=data.description, unit=data.unit,
        selling_price=data.selling_price, weight=data.weight, tags=data.tags
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return success_response(data={"id": product.id, "sku": product.sku, "name": product.name}, message="Product created")


@router.get("/{product_id}", response_model=dict)
async def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return success_response(data={
        "id": product.id, "sku": product.sku, "name": product.name,
        "category": product.category, "description": product.description,
        "selling_price": product.selling_price, "unit": product.unit,
        "weight": product.weight, "tags": product.tags
    })


@router.put("/{product_id}", response_model=dict)
async def update_product(
    product_id: int, data: ProductUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return success_response(data={"id": product.id, "name": product.name}, message="Product updated")


@router.delete("/{product_id}", response_model=dict)
async def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id, Product.deleted_at == None).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.deleted_at = datetime.utcnow()
    db.commit()
    return success_response(message="Product deleted")


# ─── COSTING ─────────────────────────────────────────────────────────────────

@router.post("/costing/calculate", response_model=dict)
async def calculate_costing(
    data: CostingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Calculate total cost
    base_cost = (
        data.leather_cost + data.accessories_cost + data.labor_cost +
        data.machine_cost + data.electricity_cost + data.overhead_cost +
        data.packaging_cost + data.transportation_cost
    )
    tax_amount = base_cost * data.tax_percentage / 100
    total_production_cost = base_cost + tax_amount
    profit_amount = total_production_cost * data.profit_margin_percentage / 100
    selling_price = total_production_cost + profit_amount
    profitability = (profit_amount / selling_price * 100) if selling_price > 0 else 0

    costing = ProductCosting(
        product_id=data.product_id,
        leather_cost=data.leather_cost,
        accessories_cost=data.accessories_cost,
        labor_cost=data.labor_cost,
        machine_cost=data.machine_cost,
        electricity_cost=data.electricity_cost,
        overhead_cost=data.overhead_cost,
        packaging_cost=data.packaging_cost,
        transportation_cost=data.transportation_cost,
        tax_percentage=data.tax_percentage,
        tax_amount=tax_amount,
        profit_margin_percentage=data.profit_margin_percentage,
        profit_amount=profit_amount,
        total_production_cost=total_production_cost,
        selling_price=selling_price,
        profitability=profitability,
        notes=data.notes
    )
    db.add(costing)
    db.commit()
    db.refresh(costing)

    return success_response(data={
        "id": costing.id,
        "product_id": costing.product_id,
        "base_cost": base_cost,
        "tax_amount": tax_amount,
        "total_production_cost": total_production_cost,
        "profit_amount": profit_amount,
        "selling_price": selling_price,
        "profitability": round(profitability, 2),
        "breakdown": {
            "leather_cost": data.leather_cost,
            "accessories_cost": data.accessories_cost,
            "labor_cost": data.labor_cost,
            "machine_cost": data.machine_cost,
            "electricity_cost": data.electricity_cost,
            "overhead_cost": data.overhead_cost,
            "packaging_cost": data.packaging_cost,
            "transportation_cost": data.transportation_cost,
        }
    }, message="Costing calculated successfully")


@router.get("/{product_id}/costing", response_model=dict)
async def get_product_costing(
    product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    costings = db.query(ProductCosting).filter(
        ProductCosting.product_id == product_id
    ).order_by(ProductCosting.created_at.desc()).all()

    return success_response(data=[{
        "id": c.id, "version": c.version,
        "leather_cost": c.leather_cost, "accessories_cost": c.accessories_cost,
        "labor_cost": c.labor_cost, "machine_cost": c.machine_cost,
        "total_production_cost": c.total_production_cost,
        "selling_price": c.selling_price, "profitability": c.profitability,
        "created_at": c.created_at
    } for c in costings])


# ─── BOM ─────────────────────────────────────────────────────────────────────

@router.post("/bom", response_model=dict)
async def create_bom(
    data: BOMCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete existing BOM if any
    existing = db.query(BOM).filter(BOM.product_id == data.product_id).first()
    if existing:
        db.delete(existing)
        db.commit()

    bom = BOM(product_id=data.product_id, description=data.description, created_by=current_user.id)
    db.add(bom)
    db.flush()

    total_cost = 0
    for item_data in data.items:
        material = db.query(RawMaterial).filter(RawMaterial.id == item_data.raw_material_id).first()
        if not material:
            continue
        effective_qty = item_data.quantity * (1 + item_data.wastage_percentage / 100)
        item_cost = effective_qty * material.unit_price
        total_cost += item_cost

        item = BOMItem(
            bom_id=bom.id,
            raw_material_id=item_data.raw_material_id,
            quantity=item_data.quantity,
            unit=item_data.unit or material.unit,
            wastage_percentage=item_data.wastage_percentage,
            effective_quantity=effective_qty,
            unit_cost=material.unit_price,
            total_cost=item_cost
        )
        db.add(item)

    db.commit()
    return success_response(data={"bom_id": bom.id, "total_material_cost": total_cost}, message="BOM created")


@router.get("/{product_id}/bom", response_model=dict)
async def get_product_bom(
    product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    bom = db.query(BOM).filter(BOM.product_id == product_id, BOM.is_active == True).first()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found for this product")

    items = []
    for item in bom.items:
        material = item.raw_material
        items.append({
            "id": item.id,
            "raw_material_id": item.raw_material_id,
            "material_name": material.name if material else "Unknown",
            "material_code": material.code if material else "N/A",
            "quantity": item.quantity,
            "unit": item.unit,
            "wastage_percentage": item.wastage_percentage,
            "effective_quantity": item.effective_quantity,
            "unit_cost": item.unit_cost,
            "total_cost": item.total_cost
        })

    return success_response(data={
        "id": bom.id, "product_id": bom.product_id,
        "version": bom.version, "description": bom.description,
        "items": items, "total_material_cost": sum(i["total_cost"] for i in items)
    })

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database.database import get_db
from app.models.quality import QualityCheck, Defect, QCStatus
from app.models.production import ProductionOrder
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.response import success_response, paginated_response
from pydantic import BaseModel

router = APIRouter(prefix="/quality", tags=["Quality Control"])

class DefectCreate(BaseModel):
    defect_type: str
    severity: str
    quantity: int = 1
    description: Optional[str] = None
    action_taken: Optional[str] = None

class QualityCheckCreate(BaseModel):
    production_order_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity_inspected: int
    quantity_passed: int
    quantity_failed: int
    status: str
    remarks: Optional[str] = None
    defects: Optional[List[DefectCreate]] = []

@router.get("/", response_model=dict)
async def get_quality_checks(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None, search: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    query = db.query(QualityCheck)
    if status:
        query = query.filter(QualityCheck.status == status)
    if search:
        query = query.filter(QualityCheck.check_number.ilike(f"%{search}%"))
        
    total = query.count()
    items = query.order_by(QualityCheck.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    data = []
    for q in items:
        # Avoid eager load errors by safely checking relationships
        prod_order_code = None
        if getattr(q, 'production_order', None):
            prod_order_code = q.production_order.order_number
            
        data.append({
            "id": q.id,
            "check_number": q.check_number,
            "production_order_id": q.production_order_id,
            "production_order_code": prod_order_code,
            "quantity_inspected": q.quantity_inspected,
            "quantity_passed": q.quantity_passed,
            "quantity_failed": q.quantity_failed,
            "status": getattr(q.status, 'value', str(q.status)),
            "remarks": q.remarks,
            "inspection_date": q.inspection_date,
            "defect_count": len(q.defects) if getattr(q, 'defects', None) else 0
        })

    return paginated_response(data=data, total=total, page=page, limit=limit)

@router.post("/", response_model=dict)
async def create_quality_check(
    data: QualityCheckCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    count = db.query(QualityCheck).count()
    qc_number = f"QC{str(count + 1).zfill(5)}"
    
    qc = QualityCheck(
        check_number=qc_number,
        production_order_id=data.production_order_id,
        product_id=data.product_id,
        inspector_id=current_user.id,
        quantity_inspected=data.quantity_inspected,
        quantity_passed=data.quantity_passed,
        quantity_failed=data.quantity_failed,
        status=data.status,
        remarks=data.remarks
    )
    db.add(qc)
    db.commit()
    db.refresh(qc)
    
    if data.defects:
        for d in data.defects:
            defect = Defect(
                quality_check_id=qc.id,
                **d.dict()
            )
            db.add(defect)
        db.commit()
        
    return success_response(data={"id": qc.id, "check_number": qc.check_number}, message="Quality check recorded")

@router.delete("/{qc_id}", response_model=dict)
async def delete_quality_check(qc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    qc = db.query(QualityCheck).filter(QualityCheck.id == qc_id).first()
    if not qc:
        raise HTTPException(status_code=404, detail="Quality check not found")
    
    db.query(Defect).filter(Defect.quality_check_id == qc_id).delete()
    db.delete(qc)
    db.commit()
    return success_response(message="Quality check deleted")

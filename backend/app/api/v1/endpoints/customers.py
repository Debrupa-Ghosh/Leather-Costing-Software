from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database.database import get_db
from app.models.customer import Customer, Supplier
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.response import success_response, paginated_response
from datetime import datetime
from pydantic import BaseModel, EmailStr

router = APIRouter(tags=["Customers & Suppliers"])

class CustomerCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    credit_limit: float = 0.0
    is_export_customer: bool = False
    notes: Optional[str] = None
 
class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    credit_limit: Optional[float] = None
    is_export_customer: Optional[bool] = None
    notes: Optional[str] = None

class SupplierCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    quality_rating: float = 0.0
    delivery_rating: float = 0.0
    price_rating: float = 0.0
    payment_terms: Optional[str] = None
    lead_time_days: int = 7
    notes: Optional[str] = None
 
class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    quality_rating: Optional[float] = None
    delivery_rating: Optional[float] = None
    price_rating: Optional[float] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    notes: Optional[str] = None


# ─── CUSTOMERS ───────────────────────────────────────────────────────────────

customer_router = APIRouter(prefix="/customers")


@customer_router.get("/", response_model=dict)
async def get_customers(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, is_export: Optional[bool] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    query = db.query(Customer).filter(Customer.deleted_at == None, Customer.is_active == True)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%") | Customer.email.ilike(f"%{search}%"))
    if is_export is not None:
        query = query.filter(Customer.is_export_customer == is_export)
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return paginated_response(data=[{
        "id": c.id, "code": c.code, "name": c.name, "company": c.company,
        "email": c.email, "phone": c.phone, "country": c.country,
        "total_orders": c.total_orders, "total_revenue": c.total_revenue,
        "outstanding_balance": c.outstanding_balance, "is_export_customer": c.is_export_customer
    } for c in items], total=total, page=page, limit=limit)


@customer_router.post("/", response_model=dict)
async def create_customer(
    data: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    count = db.query(Customer).count()
    customer = Customer(**data.dict(), code=f"CUST{str(count + 1).zfill(4)}")
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return success_response(data={"id": customer.id, "code": customer.code}, message="Customer created")

@customer_router.put("/{customer_id}", response_model=dict)
async def update_customer(
    customer_id: int, data: CustomerUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.deleted_at == None).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return success_response(message="Customer updated successfully")


@customer_router.delete("/{customer_id}", response_model=dict)
async def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.deleted_at == None).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.deleted_at = datetime.utcnow()
    db.commit()
    return success_response(message="Customer deleted")


# ─── SUPPLIERS ────────────────────────────────────────────────────────────────

supplier_router = APIRouter(prefix="/suppliers")


@supplier_router.get("/", response_model=dict)
async def get_suppliers(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    query = db.query(Supplier).filter(Supplier.deleted_at == None, Supplier.is_active == True)
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return paginated_response(data=[{
        "id": s.id, "code": s.code, "name": s.name, "company": s.company,
        "email": s.email, "phone": s.phone, "country": s.country,
        "quality_rating": s.quality_rating, "delivery_rating": s.delivery_rating,
        "price_rating": s.price_rating, "overall_rating": s.overall_rating,
        "total_orders": s.total_orders, "lead_time_days": s.lead_time_days
    } for s in items], total=total, page=page, limit=limit)


@supplier_router.post("/", response_model=dict)
async def create_supplier(
    data: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    count = db.query(Supplier).count()
    supplier_data = data.dict()
    # Calculate overall rating
    overall = (data.quality_rating + data.delivery_rating + data.price_rating) / 3
    supplier = Supplier(**supplier_data, code=f"SUP{str(count + 1).zfill(4)}", overall_rating=overall)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return success_response(data={"id": supplier.id, "code": supplier.code}, message="Supplier created")

@supplier_router.put("/{supplier_id}", response_model=dict)
async def update_supplier(
    supplier_id: int, data: SupplierUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.deleted_at == None).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)
    
    # Recalculate overall rating if any component changed
    if any(k in update_data for k in ["quality_rating", "delivery_rating", "price_rating"]):
        supplier.overall_rating = (supplier.quality_rating + supplier.delivery_rating + supplier.price_rating) / 3
        
    db.commit()
    db.refresh(supplier)
    return success_response(message="Supplier updated successfully")


@supplier_router.delete("/{supplier_id}", response_model=dict)
async def delete_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.deleted_at == None).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.deleted_at = datetime.utcnow()
    db.commit()
    return success_response(message="Supplier deleted")


router.include_router(customer_router)
router.include_router(supplier_router)

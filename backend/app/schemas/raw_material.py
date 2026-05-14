from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.raw_material import LeatherGrade
from app.models.inventory import TransactionType


class RawMaterialCreate(BaseModel):
    code: Optional[str] = None
    name: str
    leather_type: Optional[str] = None
    color: Optional[str] = None
    thickness: Optional[float] = None
    grade: Optional[LeatherGrade] = LeatherGrade.standard
    unit: str = "sqft"
    unit_price: float = 0.0
    supplier_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    minimum_stock: float = 10.0
    maximum_stock: float = 1000.0
    reorder_point: float = 50.0
    batch_number: Optional[str] = None
    lot_number: Optional[str] = None
    description: Optional[str] = None


class RawMaterialUpdate(BaseModel):
    name: Optional[str] = None
    leather_type: Optional[str] = None
    color: Optional[str] = None
    thickness: Optional[float] = None
    grade: Optional[LeatherGrade] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    supplier_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    minimum_stock: Optional[float] = None
    maximum_stock: Optional[float] = None
    reorder_point: Optional[float] = None
    batch_number: Optional[str] = None
    lot_number: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RawMaterialResponse(BaseModel):
    id: int
    code: str
    name: str
    leather_type: Optional[str]
    color: Optional[str]
    thickness: Optional[float]
    grade: Optional[LeatherGrade]
    unit: str
    unit_price: float
    current_stock: float
    minimum_stock: float
    reorder_point: float
    supplier_id: Optional[int]
    warehouse_id: Optional[int]
    batch_number: Optional[str]
    lot_number: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WarehouseCreate(BaseModel):
    name: str
    location: Optional[str] = None
    capacity: Optional[float] = None
    manager_name: Optional[str] = None
    phone: Optional[str] = None


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[float] = None
    manager_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class WarehouseResponse(BaseModel):
    id: int
    code: str
    name: str
    location: Optional[str]
    capacity: Optional[float]
    manager_name: Optional[str]
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class InventoryTransactionCreate(BaseModel):
    transaction_type: TransactionType
    quantity: float
    unit_price: Optional[float] = None
    warehouse_id: Optional[int] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

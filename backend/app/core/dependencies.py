from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from typing import Optional

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id), User.is_active == True, User.deleted_at == None).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


def require_roles(*roles: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


require_admin = require_roles(UserRole.super_admin)
require_manager = require_roles(UserRole.super_admin, UserRole.factory_manager)
require_accountant = require_roles(UserRole.super_admin, UserRole.factory_manager, UserRole.accountant)
require_production = require_roles(UserRole.super_admin, UserRole.factory_manager, UserRole.production_manager)
require_inventory = require_roles(UserRole.super_admin, UserRole.factory_manager, UserRole.inventory_manager)

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database.database import get_db
from app.models.user import User, UserRole
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token, create_reset_token
)
from app.schemas.auth import (
    UserCreate, UserLogin, Token, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest
)
from app.core.dependencies import get_current_user
from app.utils.response import success_response, error_response
from app.services.email_service import email_service
import secrets
import random

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create employee ID
    count = db.query(User).count()
    employee_id = f"LF{str(count + 1).zfill(4)}"

    hashed_password = get_password_hash(user_data.password)
    user = User(
        employee_id=employee_id,
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role or UserRole.worker,
        phone=user_data.phone,
        department=user_data.department,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return success_response(
        data={
            "user": UserResponse.from_orm(user).dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        },
        message="Registration successful"
    )


@router.post("/login", response_model=dict)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == user_data.email,
        User.deleted_at == None
    ).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact admin.")

    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return success_response(
        data={
            "user": UserResponse.from_orm(user).dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        },
        message="Login successful"
    )


@router.post("/refresh", response_model=dict)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token(data={"sub": str(user.id)})
    return success_response(data={"access_token": access_token}, message="Token refreshed")


@router.post("/forgot-password", response_model=dict)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found in our records")

    otp = str(random.randint(100000, 999999))
    user.reset_token = otp
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    # Send OTP email
    await email_service.send_otp_email(request.email, otp)
    return success_response(message="Verification code sent successfully to your email")


@router.post("/reset-password", response_model=dict)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.reset_token or user.reset_token != request.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if user.reset_token_expiry and datetime.utcnow() > user.reset_token_expiry:
        raise HTTPException(status_code=400, detail="Verification code has expired")

    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return success_response(message="Password reset successfully")


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return success_response(data=UserResponse.from_orm(current_user).dict())


@router.post("/logout", response_model=dict)
async def logout(current_user: User = Depends(get_current_user)):
    return success_response(message="Logged out successfully")

"""
Authentication and User Profile management service.
"""

from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.user import User, UserRole
from backend.app.schemas.auth import UserRegister, UserLogin
from backend.app.utils.security import verify_password, get_password_hash, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, reg_data: UserRegister) -> User:
        # Check if username or email exists
        if db.query(User).filter(User.username == reg_data.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken."
            )
        if db.query(User).filter(User.email == reg_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered."
            )

        role = UserRole.technician
        if reg_data.role:
            try:
                role = UserRole(reg_data.role)
            except ValueError:
                role = UserRole.technician

        user = User(
            username=reg_data.username,
            email=reg_data.email,
            hashed_password=get_password_hash(reg_data.password),
            full_name=reg_data.full_name,
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Optional[User]:
        user = db.query(User).filter(User.username == login_data.username).first()
        if not user:
            return None
        if not verify_password(login_data.password, user.hashed_password):
            return None
        return user

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.auth import UserRegister, UserLogin, Token, UserProfile
from backend.app.services.auth_service import AuthService
from backend.app.utils.security import create_access_token, oauth2_scheme, decode_access_token
from backend.app.models.user import User

router = APIRouter(prefix="/auth", tags=["User Authentication & RBAC"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials."
        )
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def register(reg_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account with role assignment (admin, analyst, technician)."""
    user = AuthService.register_user(db, reg_data)
    return user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with username and password; returns JWT access token."""
    user = AuthService.authenticate_user(db, login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password."
        )
    token = create_access_token(data={"sub": user.username, "role": user.role.value, "uid": user.id})
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=86400,
        user_id=user.id,
        username=user.username,
        role=user.role.value,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    return current_user

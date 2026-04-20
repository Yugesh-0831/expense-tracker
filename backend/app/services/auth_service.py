from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import create_user, get_user_by_email

logger = get_logger(__name__)


def signup_user(db: Session, *, email: str, password: str) -> User:
    normalized_email = email.lower()
    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        logger.warning("Signup rejected for duplicate email: %s", normalized_email)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = create_user(db, email=normalized_email, password_hash=hash_password(password))
    logger.info("User created: user_id=%s email=%s", user.id, user.email)
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User:
    normalized_email = email.lower()
    user = get_user_by_email(db, normalized_email)
    if user is None or not verify_password(password, user.password_hash):
        logger.warning("Login failed for email=%s", normalized_email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    logger.info("Login succeeded: user_id=%s", user.id)
    return user


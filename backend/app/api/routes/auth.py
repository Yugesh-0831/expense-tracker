from logging import Logger
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import DbSession, get_current_user
from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import create_access_token
from app.models.user import User
from app.services.auth_service import authenticate_user, signup_user
from app.schemas.auth import LoginRequest, SignupRequest, UserResponse

router = APIRouter()
logger: Logger = get_logger(__name__)


def set_auth_cookie(response: Response, token: str) -> None:
    expires = datetime.now(UTC) + timedelta(days=settings.jwt_expire_days)
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        expires=expires,
        domain=settings.cookie_domain or None,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        domain=settings.cookie_domain or None,
        path="/",
    )


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, response: Response, db: DbSession) -> User:
    user = signup_user(db, email=payload.email, password=payload.password)
    set_auth_cookie(response, create_access_token(user.id))
    return user


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: DbSession) -> User:
    user = authenticate_user(db, email=payload.email, password=payload.password)
    set_auth_cookie(response, create_access_token(user.id))
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    response.status_code = status.HTTP_204_NO_CONTENT
    clear_auth_cookie(response)
    logger.info("User logged out")
    return response


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user

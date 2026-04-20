from logging import Logger

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, get_current_user
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.expense import ExpenseAnalyticsResponse, ExpenseCreate, ExpenseListResponse, ExpenseResponse
from app.services.expense_service import create_expense_for_user, get_expense_analytics, get_expense_list

router = APIRouter()
logger: Logger = get_logger(__name__)


@router.get("/analytics", response_model=ExpenseAnalyticsResponse)
def expense_analytics(db: DbSession, current_user: User = Depends(get_current_user)) -> ExpenseAnalyticsResponse:
    return get_expense_analytics(db, user_id=current_user.id)


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate, db: DbSession, current_user: User = Depends(get_current_user)
) -> ExpenseResponse:
    return create_expense_for_user(db, user_id=current_user.id, payload=payload)


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    db: DbSession,
    current_user: User = Depends(get_current_user),
    category: str | None = Query(default=None),
    sort: str = Query(default="date_desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> ExpenseListResponse:
    return get_expense_list(
        db,
        user_id=current_user.id,
        category=category,
        sort=sort,
        page=page,
        page_size=page_size,
    )

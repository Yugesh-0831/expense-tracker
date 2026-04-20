from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.constants import CATEGORIES
from app.core.logging import get_logger
from app.models.expense import Expense
from app.repositories.expense_repository import create_expense, list_expenses, list_recent_expenses, get_expense_by_idempotency_key
from app.schemas.expense import ExpenseAnalyticsResponse, ExpenseCreate, ExpenseListResponse, ExpenseResponse, paise_to_amount_string, normalize_amount_to_paise

logger = get_logger(__name__)


def serialize_expense(expense: Expense) -> ExpenseResponse:
    return ExpenseResponse(
        id=expense.id,
        amount=paise_to_amount_string(expense.amount_paise),
        category=expense.category,
        description=expense.description,
        date=expense.expense_date,
        created_at=expense.created_at,
    )


def create_expense_for_user(db: Session, *, user_id: int, payload: ExpenseCreate, idempotency_key: str | None = None) -> ExpenseResponse:
    if idempotency_key:
        existing = get_expense_by_idempotency_key(db, user_id=user_id, idempotency_key=idempotency_key)
        if existing:
            logger.info("Idempotency hit: user_id=%s idempotency_key=%s", user_id, idempotency_key)
            return serialize_expense(existing)

    try:
        expense = create_expense(
            db,
            user_id=user_id,
            amount_paise=normalize_amount_to_paise(payload.amount),
            category=payload.category,
            description=payload.description,
            expense_date=payload.date,
            idempotency_key=idempotency_key,
        )
    except IntegrityError:
        db.rollback()
        # Edge case: Concurrent duplicate hit caught by UniqueConstraint
        existing = get_expense_by_idempotency_key(db, user_id=user_id, idempotency_key=idempotency_key) # type: ignore
        if existing:
            return serialize_expense(existing)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Expense could not be created due to conflict")

    logger.info(
        "Expense created: expense_id=%s user_id=%s category=%s amount_paise=%s",
        expense.id,
        user_id,
        expense.category,
        expense.amount_paise,
    )
    return serialize_expense(expense)


def get_expense_analytics(db: Session, *, user_id: int) -> ExpenseAnalyticsResponse:
    recent_expenses = list_recent_expenses(db, user_id=user_id, limit=5)
    logger.info("Expense analytics read: user_id=%s recent_count=%s", user_id, len(recent_expenses))
    return ExpenseAnalyticsResponse(recent_expenses=[serialize_expense(expense) for expense in recent_expenses])


def get_expense_list(
    db: Session,
    *,
    user_id: int,
    category: str | None,
    sort: str,
    page: int,
    page_size: int,
) -> ExpenseListResponse:
    if category and category not in CATEGORIES:
        logger.warning("Invalid category filter received: user_id=%s category=%s", user_id, category)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category filter")

    if sort not in {"date_desc", "date_asc"}:
        logger.warning("Unsupported sort received: user_id=%s sort=%s", user_id, sort)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported sort")

    expenses, total_count = list_expenses(
        db,
        user_id=user_id,
        category=category,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    logger.info(
        "Expenses listed: user_id=%s count=%s category=%s page=%s page_size=%s",
        user_id,
        len(expenses),
        category or "all",
        page,
        page_size,
    )
    return ExpenseListResponse(
        expenses=[serialize_expense(expense) for expense in expenses],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )

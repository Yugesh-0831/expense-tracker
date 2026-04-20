from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from app.models.expense import Expense


def create_expense(
    db: Session,
    *,
    user_id: int,
    amount_paise: int,
    category: str,
    description: str | None,
    expense_date,
) -> Expense:
    expense = Expense(
        user_id=user_id,
        amount_paise=amount_paise,
        category=category,
        description=description,
        expense_date=expense_date,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def list_expenses(
    db: Session,
    *,
    user_id: int,
    category: str | None,
    sort: str,
    page: int,
    page_size: int,
) -> tuple[list[Expense], int]:
    statement = select(Expense).where(Expense.user_id == user_id)
    if category:
        statement = statement.where(Expense.category == category)

    count_statement = select(func.count()).select_from(statement.subquery())

    if sort == "date_desc":
        statement = statement.order_by(desc(Expense.expense_date), desc(Expense.created_at), desc(Expense.id))
    else:
        statement = statement.order_by(asc(Expense.expense_date), asc(Expense.created_at), asc(Expense.id))

    total_count = db.scalar(count_statement) or 0
    statement = statement.offset((page - 1) * page_size).limit(page_size)
    expenses = db.scalars(statement).all()
    return expenses, total_count


def list_recent_expenses(db: Session, *, user_id: int, limit: int = 5) -> list[Expense]:
    statement = (
        select(Expense).where(Expense.user_id == user_id).order_by(desc(Expense.created_at), desc(Expense.id)).limit(limit)
    )
    return db.scalars(statement).all()


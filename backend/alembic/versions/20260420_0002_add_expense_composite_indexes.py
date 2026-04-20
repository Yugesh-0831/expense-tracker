"""add expense composite indexes

Revision ID: 20260420_0002
Revises: 20260420_0001
Create Date: 2026-04-20 23:10:00
"""

from alembic import op


revision = "20260420_0002"
down_revision = "20260420_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_expenses_user_id_expense_date", "expenses", ["user_id", "expense_date"], unique=False)
    op.create_index("ix_expenses_user_id_category", "expenses", ["user_id", "category"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_expenses_user_id_category", table_name="expenses")
    op.drop_index("ix_expenses_user_id_expense_date", table_name="expenses")


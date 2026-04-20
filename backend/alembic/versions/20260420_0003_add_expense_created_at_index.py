"""add expense created_at composite index

Revision ID: 20260420_0003
Revises: 20260420_0002
Create Date: 2026-04-20 23:45:00
"""

from alembic import op


revision = "20260420_0003"
down_revision = "20260420_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_expenses_user_id_created_at", "expenses", ["user_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_expenses_user_id_created_at", table_name="expenses")

from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.constants import CATEGORIES


def normalize_amount_to_paise(amount: str) -> int:
    try:
        value = Decimal(amount)
    except InvalidOperation as exc:
        raise ValueError("Amount must be a valid decimal value") from exc

    if value <= 0:
        raise ValueError("Amount must be greater than 0")

    quantized = value.quantize(Decimal("0.01"))
    return int(quantized * 100)


def paise_to_amount_string(amount_paise: int) -> str:
    value = Decimal(amount_paise) / Decimal("100")
    return format(value, ".2f")


class ExpenseCreate(BaseModel):
    amount: str = Field(min_length=1, max_length=32)
    category: str
    description: str | None = Field(default=None, max_length=500)
    date: date

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in CATEGORIES:
            raise ValueError("Category must be one of the allowed values")
        return value

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: str) -> str:
        normalize_amount_to_paise(value)
        return value

    @field_validator("date")
    @classmethod
    def validate_date_not_in_future(cls, value: date) -> date:
        if value > date.today() + timedelta(days=1):
            raise ValueError("Date cannot be in the future")
        return value


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: str
    category: str
    description: str | None
    date: date
    created_at: datetime


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total_count: int
    page: int
    page_size: int


class ExpenseAnalyticsResponse(BaseModel):
    recent_expenses: list[ExpenseResponse]

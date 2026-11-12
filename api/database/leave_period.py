from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class LeavePeriod(SQLModel, table=True):
    __tablename__ = "leave_period"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    end_text: Optional[str] = None

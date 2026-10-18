from datetime import date, datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from enums import RefreshRunStatus


class RefreshRun(SQLModel, table=True):
    __tablename__ = "refresh_run"

    id: int = Field(primary_key=True)
    latest_sitting_date_with_text: Optional[date] = None
    figures: Optional[dict[str, object]] = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
    started_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    finished_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    status: RefreshRunStatus = Field(sa_column=Column(Text, nullable=False))

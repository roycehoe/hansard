from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class RefreshRunGroupData(BaseModel):
    group: str
    linked_row_count: int
    named_unlinked_row_count: int
    row_count: int
    linked_character_count: int
    body_character_count: int


class RefreshRunFiguresData(BaseModel):
    measured_at: datetime
    groups: list[RefreshRunGroupData]


class GetRefreshResponse(BaseModel):
    latest_sitting_date: Optional[date]
    last_checked_date: Optional[date]

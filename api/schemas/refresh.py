from datetime import date
from typing import Optional

from pydantic import BaseModel


class ParliamentGroupFiguresData(BaseModel):
    first_parliament_number: int
    last_parliament_number: int
    linked_row_count: int
    speaker_label_row_count: int
    row_count: int
    named_linked_share: float
    all_linked_share: float
    text_share: float


class RefreshFiguresData(BaseModel):
    measured_on: date
    groups: list[ParliamentGroupFiguresData]


class GetRefreshResponse(BaseModel):
    latest_sitting_date: Optional[date]
    last_checked_date: Optional[date]
    figures: Optional[RefreshFiguresData]

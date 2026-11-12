from datetime import date
from typing import Optional

from pydantic import BaseModel


class SeatHolderData(BaseModel):
    person_id: Optional[int]
    person_name: Optional[str]
    parliament_number: int
    party: str
    location_name: str
    first_sitting_date: date
    last_sitting_date: date
    sitting_count: int


class GetSeatHistoryResponse(BaseModel):
    constituency: str
    holders: list[SeatHolderData]

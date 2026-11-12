from datetime import date

from sqlmodel import Field, SQLModel


class SeatHolding(SQLModel, table=True):
    __tablename__ = "seat_holding"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    division_key: str
    location_name: str
    first_sitting_date: date
    last_sitting_date: date
    sitting_count: int
    speaker_id: int

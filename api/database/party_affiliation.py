from datetime import date
from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import DatePrecision


class PartyAffiliation(SQLModel, table=True):
    id: int = Field(primary_key=True)
    party: str
    started_on: date
    started_on_precision: DatePrecision = Field(
        sa_type=ENUM(DatePrecision, name="dateprecision", create_type=False)
    )
    event: str
    source_url: Optional[str] = None
    is_started_on_upper_bound: bool
    speaker_id: int
    source_report_id: Optional[int] = None

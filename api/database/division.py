from datetime import date
from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import DivisionCountSource, DivisionListStatus


class Division(SQLModel, table=True):
    id: int = Field(primary_key=True)
    sitting_date: date
    parliament_number: int
    speech_ordinal: Optional[int] = None
    count_source: DivisionCountSource = Field(
        sa_type=ENUM(DivisionCountSource, name="divisioncountsource", create_type=False)
    )
    printed_counts: str
    ayes: Optional[int] = None
    noes: Optional[int] = None
    abstentions: Optional[int] = None
    absent: Optional[int] = None
    paired: Optional[int] = None
    list_status: DivisionListStatus = Field(
        sa_type=ENUM(DivisionListStatus, name="divisionliststatus", create_type=False)
    )
    printed_list: Optional[str] = None
    sprs_report_id: Optional[str] = None

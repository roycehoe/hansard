from datetime import date
from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import ActHistoryEntryKind, BillLinkSource


class ActHistoryEntry(SQLModel, table=True):
    id: int = Field(primary_key=True)
    ordinal: int
    printed_law_number: str
    printed_title: str
    printed_bill_number: Optional[str] = None
    first_reading_date: Optional[date] = None
    second_reading_date: Optional[date] = None
    third_reading_date: Optional[date] = None
    commencement_date: Optional[date] = None
    kind: ActHistoryEntryKind = Field(
        sa_type=ENUM(ActHistoryEntryKind, name="acthistoryentrykind", create_type=False)
    )
    bill_link_source: Optional[BillLinkSource] = Field(
        default=None,
        sa_type=ENUM(BillLinkSource, name="billlinksource", create_type=False),
    )
    act_id: int
    bill_id: Optional[int] = None

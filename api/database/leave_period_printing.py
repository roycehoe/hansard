from datetime import date
from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import (
    LeaveEntryFormat,
    LeaveNameSource,
    LeaveOfficeSource,
    LeaveYearSource,
)


class LeavePeriodPrinting(SQLModel, table=True):
    __tablename__ = "leave_period_printing"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    ordinal: int
    sitting_date: date
    printed_name: Optional[str] = None
    carried_name: Optional[str] = None
    printed_from: Optional[str] = None
    printed_to: Optional[str] = None
    printed_line: Optional[str] = None
    printed_heading_from: Optional[str] = None
    printed_heading_to: Optional[str] = None
    office_printed: Optional[str] = None
    entry_format: LeaveEntryFormat = Field(
        sa_type=ENUM(LeaveEntryFormat, name="leaveentryformat", create_type=False)
    )
    name_source: LeaveNameSource = Field(
        sa_type=ENUM(LeaveNameSource, name="leavenamesource", create_type=False)
    )
    year_source: Optional[LeaveYearSource] = Field(
        default=None,
        sa_type=ENUM(LeaveYearSource, name="leaveyearsource", create_type=False),
    )
    office_source: Optional[LeaveOfficeSource] = Field(
        default=None,
        sa_type=ENUM(LeaveOfficeSource, name="leaveofficesource", create_type=False),
    )
    is_covering_sitting: Optional[bool] = None
    leave_period_id: int
    speaker_id: Optional[int] = None

from datetime import datetime

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import AttendanceOfficeSource


class AttendanceOffice(SQLModel, table=True):
    __tablename__ = "attendance_office"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    office_printed: str
    entry_line_printed: str
    source: AttendanceOfficeSource = Field(
        sa_type=ENUM(
            AttendanceOfficeSource, name="attendanceofficesource", create_type=False
        )
    )
    extracted_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    attendance_id: int

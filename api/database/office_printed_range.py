from pydantic import NaiveDatetime
from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import OfficeClass


class OfficePrintedRange(SQLModel, table=True):
    __tablename__ = "office_printed_range"

    id: int = Field(primary_key=True)
    office_printed: str
    office_class: OfficeClass = Field(
        sa_type=ENUM(OfficeClass, name="officeclass", create_type=False)
    )
    sitting_count: int
    first_sitting_date: NaiveDatetime
    last_sitting_date: NaiveDatetime
    speaker_id: int
    first_attendance_office_id: int
    last_attendance_office_id: int

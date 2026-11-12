from datetime import date
from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import MinutesFileFormat, MinutesStatus


class Minutes(SQLModel, table=True):
    id: int = Field(primary_key=True)
    sitting_date: date
    printed_label: Optional[str] = None
    printed_parliament: Optional[str] = None
    file_url: Optional[str] = None
    archive_timestamp: Optional[str] = None
    file_format: Optional[MinutesFileFormat] = Field(
        default=None,
        sa_type=ENUM(MinutesFileFormat, name="minutesfileformat", create_type=False),
    )
    status: MinutesStatus = Field(
        sa_type=ENUM(MinutesStatus, name="minutesstatus", create_type=False)
    )

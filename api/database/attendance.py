from typing import Optional

from sqlmodel import Field, SQLModel


class Attendance(SQLModel, table=True):
    id: int = Field(primary_key=True)
    speaker_name: Optional[str] = None
    location_name: Optional[str] = None
    is_present: Optional[bool] = None
    sitting_id: Optional[int] = None
    speaker_id: Optional[int] = None

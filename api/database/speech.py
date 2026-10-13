from typing import Optional

from sqlmodel import Field, SQLModel


class Speech(SQLModel, table=True):
    id: int = Field(primary_key=True)
    ordinal: int
    speaker: Optional[str] = None
    transcript: str
    report_id: Optional[int] = None
    speaker_id: Optional[int] = None

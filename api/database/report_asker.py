from typing import Optional

from sqlmodel import Field, SQLModel


class ReportAsker(SQLModel, table=True):
    __tablename__ = "report_asker"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    ordinal: int
    printed_name: str
    report_id: int
    speaker_id: Optional[int] = None
    reader_speaker_id: Optional[int] = None

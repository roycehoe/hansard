from typing import Optional

from sqlmodel import Field, SQLModel


class AttachedFilePointer(SQLModel, table=True):
    __tablename__ = "attached_file_pointer"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    ordinal: int
    printed_text: str
    download_value: Optional[str] = None
    speech_ordinal: Optional[int] = None
    sprs_report_id: str
    attached_file_id: Optional[int] = None

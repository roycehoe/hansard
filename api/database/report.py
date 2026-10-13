from typing import Optional

from pydantic import NaiveDatetime
from sqlmodel import Field, SQLModel


class Report(SQLModel, table=True):
    id: int = Field(primary_key=True)
    volume_number: int
    parliament_number: int
    sitting_number: Optional[int] = None
    sitting_date: NaiveDatetime
    speech_number: int
    title: str
    subtitle: Optional[str] = None
    report_id: str
    report_type: str
    html_file_name: Optional[str] = None
    markdown_content: Optional[str] = None
    report_version: str

from typing import ClassVar, Optional

from pydantic import NaiveDatetime
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import deferred
from sqlmodel import Field, SQLModel


class Report(SQLModel, table=True):
    id: int = Field(primary_key=True)
    volume_number: int
    parliament_number: int
    sitting_number: Optional[int] = None
    sitting_date: NaiveDatetime
    speech_number: int
    title: str
    # NOTE: a deferred class attribute, so reading a Report never loads the vector
    title_tsv: ClassVar = deferred(Column(TSVECTOR))
    subtitle: Optional[str] = None
    report_id: str
    report_type: str
    html_file_name: Optional[str] = None
    markdown_content: Optional[str] = None
    column_start: Optional[int] = None
    column_end: Optional[int] = None
    report_version: str

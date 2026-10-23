from typing import ClassVar, Optional

from pydantic import NaiveDatetime
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ENUM, TSVECTOR
from sqlalchemy.orm import deferred
from sqlmodel import Field, SQLModel

from enums import ColumnNote, SpeechKind


class Speech(SQLModel, table=True):
    id: int = Field(primary_key=True)
    ordinal: int
    speaker: Optional[str] = None
    transcript: str
    kind: Optional[SpeechKind] = Field(
        default=None,
        sa_type=ENUM(SpeechKind, name="speechkind", create_type=False),
    )
    # NOTE: a deferred class attribute, so reading a Speech never loads the vector
    transcript_tsv: ClassVar = deferred(Column(TSVECTOR))
    sitting_date: NaiveDatetime
    column_start: Optional[int] = None
    column_note: Optional[ColumnNote] = Field(
        default=None,
        sa_type=ENUM(ColumnNote, name="columnnote", create_type=False),
    )
    column_suggested: Optional[int] = None
    report_id: Optional[int] = None
    speaker_id: Optional[int] = None

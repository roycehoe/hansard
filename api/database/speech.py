from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import SpeechKind


class Speech(SQLModel, table=True):
    id: int = Field(primary_key=True)
    ordinal: int
    speaker: Optional[str] = None
    transcript: str
    kind: Optional[SpeechKind] = Field(
        default=None,
        sa_type=ENUM(SpeechKind, name="speechkind", create_type=False),
    )
    report_id: Optional[int] = None
    speaker_id: Optional[int] = None

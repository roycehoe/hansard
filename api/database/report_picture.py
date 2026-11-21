from typing import Any, Optional

from sqlalchemy import Column, LargeBinary
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlmodel import Field, SQLModel

from enums import PictureKind


class ReportPicture(SQLModel, table=True):
    __tablename__ = "report_picture"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    kind: PictureKind = Field(
        sa_type=ENUM(PictureKind, name="picturekind", create_type=False)
    )
    picture_index: int
    follows_ordinal: Optional[int] = None
    media_type: str
    sha256: str
    picture_bytes: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    typed_copy: Optional[dict[str, Any]] = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
    report_id: int

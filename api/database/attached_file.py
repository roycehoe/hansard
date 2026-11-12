from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import AttachedFileKind


class AttachedFile(SQLModel, table=True):
    __tablename__ = "attached_file"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    kind: AttachedFileKind = Field(
        sa_type=ENUM(AttachedFileKind, name="attachedfilekind", create_type=False)
    )
    sprs_file_id: int
    printed_title: str
    file_name: str
    section_type: Optional[str] = None
    download_value: Optional[str] = None
    sitting_id: int

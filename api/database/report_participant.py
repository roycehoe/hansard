from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import OfficeClass, ParticipantRole


class ReportParticipant(SQLModel, table=True):
    __tablename__ = "report_participant"

    id: int = Field(primary_key=True)
    ordinal: int
    role: ParticipantRole = Field(
        sa_type=ENUM(ParticipantRole, name="participantrole", create_type=False)
    )
    printed_name: str
    answering_for_printed: Optional[str] = None
    office_printed: Optional[str] = None
    office_class: Optional[OfficeClass] = Field(
        default=None, sa_type=ENUM(OfficeClass, name="officeclass", create_type=False)
    )
    report_id: int
    speaker_id: Optional[int] = None

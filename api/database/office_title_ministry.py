from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import OfficeTitleMinistrySource


class OfficeTitleMinistry(SQLModel, table=True):
    __tablename__ = "office_title_ministry"

    id: int = Field(primary_key=True)
    office_printed: str
    ordinal: int
    source: OfficeTitleMinistrySource = Field(
        sa_type=ENUM(
            OfficeTitleMinistrySource,
            name="officetitleministrysource",
            create_type=False,
        )
    )
    ministry_id: int

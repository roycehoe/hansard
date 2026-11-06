from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import PersonNameSpellingKind


class PersonNameSpelling(SQLModel, table=True):
    id: int = Field(primary_key=True)
    ordinal: int
    spelling: str
    kind: PersonNameSpellingKind = Field(
        sa_type=ENUM(
            PersonNameSpellingKind, name="personnamespellingkind", create_type=False
        )
    )
    note: str
    person_id: int

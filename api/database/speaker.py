from typing import Optional

from sqlmodel import Field, SQLModel


class Speaker(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    party: str
    parliament_number: int
    is_legislative_assembly: bool
    is_member: bool
    person_id: Optional[int] = None

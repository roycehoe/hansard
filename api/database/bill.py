from pydantic import NaiveDatetime
from sqlmodel import Field, SQLModel


class Bill(SQLModel, table=True):
    id: int = Field(primary_key=True)
    title: str
    first_sitting_date: NaiveDatetime
    last_sitting_date: NaiveDatetime
    is_passed: bool

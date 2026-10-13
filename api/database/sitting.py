from typing import Optional

from sqlmodel import Field, SQLModel


class Sitting(SQLModel, table=True):
    id: int = Field(primary_key=True)
    session_no: Optional[int] = None
    sitting_date: Optional[str] = None

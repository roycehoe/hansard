from sqlmodel import Field, SQLModel


class Person(SQLModel, table=True):
    id: int = Field(primary_key=True)
    canonical_name: str

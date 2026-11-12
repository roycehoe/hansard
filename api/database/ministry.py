from sqlmodel import Field, SQLModel


class Ministry(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str

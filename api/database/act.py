from sqlmodel import Field, SQLModel


class Act(SQLModel, table=True):
    id: int = Field(primary_key=True)
    sso_code: str
    title: str

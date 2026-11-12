from sqlmodel import Field, SQLModel


class MinistrySeeAlso(SQLModel, table=True):
    __tablename__ = "ministry_see_also"

    id: int = Field(primary_key=True)
    note: str
    source_url: str
    ministry_id: int
    see_also_ministry_id: int

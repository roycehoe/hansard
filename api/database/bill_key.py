from sqlmodel import Field, SQLModel


class BillKey(SQLModel, table=True):
    id: int = Field(primary_key=True)
    act_count: int
    bill_key: str
    bill_id: int

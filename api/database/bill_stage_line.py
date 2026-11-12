from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import BillStage


class BillStageLine(SQLModel, table=True):
    id: int = Field(primary_key=True)
    stage: BillStage = Field(
        sa_type=ENUM(BillStage, name="billstage", create_type=False)
    )
    printed_text: str
    ordinal: int
    sprs_report_id: str

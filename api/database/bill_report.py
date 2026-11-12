from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import BillReportRole


class BillReport(SQLModel, table=True):
    id: int = Field(primary_key=True)
    role: BillReportRole = Field(
        sa_type=ENUM(BillReportRole, name="billreportrole", create_type=False)
    )
    bill_id: int
    report_id: int

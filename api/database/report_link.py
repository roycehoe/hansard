from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import ReportLinkType


class ReportLink(SQLModel, table=True):
    __tablename__ = "report_link"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    link_type: ReportLinkType = Field(
        sa_type=ENUM(ReportLinkType, name="reportlinktype", create_type=False)
    )
    printed_citation: str
    source_report_id: str
    target_report_id: str

from sqlmodel import Field, SQLModel


class ReportPutTo(SQLModel, table=True):
    __tablename__ = "report_put_to"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    ordinal: int
    office_printed: str
    printed_text: str
    sprs_report_id: str

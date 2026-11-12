from sqlmodel import Field, SQLModel


class BillReportSpeaker(SQLModel, table=True):
    id: int = Field(primary_key=True)
    speech_count: int
    printed_speaker: str
    sprs_report_id: str
    speaker_id: int

from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import ColumnNote, SpeechKind, SpeechLinkStatus


class SpeechData(BaseModel):
    ordinal: int
    speaker_label: str
    transcript: str
    kind: Optional[SpeechKind]
    person_id: Optional[int]
    person_slug: str
    person_name: str
    is_shared_role_credit: bool
    anchor: str
    column_start: Optional[int]
    column_note: Optional[ColumnNote]
    column_suggested: Optional[int]


class SpeechLinkData(BaseModel):
    status: SpeechLinkStatus
    ordinal: Optional[int]


class ReferencedReportData(BaseModel):
    report_slug: str
    title: str


class AskerData(BaseModel):
    person_id: int
    person_slug: str
    person_name: str
    printed_name: str
    reader_person_name: str


class GetReportResponse(BaseModel):
    report_slug: str
    title: str
    subtitle: str
    report_type: str
    parliament_number: int
    volume_number: int
    sitting_number: Optional[int]
    sitting_date: date
    official_record_url: str
    is_text_available: bool
    speeches: list[SpeechData]
    askers: list[AskerData]
    speech_link: Optional[SpeechLinkData]
    referenced_written_answer: Optional[ReferencedReportData]
    referencing_oral_answer: Optional[ReferencedReportData]
    previous_report: Optional[ReferencedReportData]
    next_report: Optional[ReferencedReportData]


class GetReportMatchedWordsResponse(BaseModel):
    words: list[str]

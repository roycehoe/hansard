from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import SpeechKind


class SpeechMatchData(BaseModel):
    report_slug: str
    title: str
    report_type: str
    sitting_date: date
    parliament_number: int
    ordinal: int
    speaker_label: str
    kind: Optional[SpeechKind]
    person_id: Optional[int]
    person_slug: str
    person_name: str
    snippet: str


class SearchSpeechesResponse(BaseModel):
    results: list[SpeechMatchData]
    page: int
    page_size: int
    has_next_page: bool
    total_count: int
    is_total_capped: bool


class ReportMatchData(BaseModel):
    report_slug: str
    title: str
    report_type: str
    sitting_date: date
    parliament_number: int
    is_text_available: bool
    snippet: str


class SearchReportsResponse(BaseModel):
    results: list[ReportMatchData]
    page: int
    page_size: int
    has_next_page: bool
    total_count: int
    is_total_capped: bool

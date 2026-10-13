from datetime import date
from typing import Optional

from pydantic import BaseModel


class SpeechData(BaseModel):
    ordinal: int
    speaker_label: str
    transcript: str
    person_id: Optional[int]
    person_slug: str
    person_name: str


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

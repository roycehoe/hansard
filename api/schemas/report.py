from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import SpeechKind, SpeechLinkStatus


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


class SpeechLinkData(BaseModel):
    status: SpeechLinkStatus
    ordinal: Optional[int]


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
    speech_link: Optional[SpeechLinkData]

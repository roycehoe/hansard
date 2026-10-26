from datetime import date
from typing import Optional

from pydantic import BaseModel


class YearCoverageData(BaseModel):
    year: int
    report_count: int
    text_report_count: int


class ParliamentGroupFiguresData(BaseModel):
    first_parliament_number: int
    last_parliament_number: int
    linked_row_count: int
    speaker_label_row_count: int
    row_count: int
    named_linked_share: float
    all_linked_share: float
    text_share: float


class AttributionFiguresData(BaseModel):
    measured_on: date
    groups: list[ParliamentGroupFiguresData]


class GetCoverageResponse(BaseModel):
    report_count: int
    text_report_count: int
    speech_count: int
    linked_speech_count: int
    person_count: int
    membership_count: int
    non_member_membership_count: int
    non_member_person_count: int
    sitting_count: int
    attendance_count: int
    linked_attendance_count: int
    first_sitting_date: Optional[date]
    last_sitting_date: Optional[date]
    text_first_sitting_date: Optional[date]
    text_last_sitting_date: Optional[date]
    attendance_last_sitting_date: Optional[date]
    years: list[YearCoverageData]
    attribution: Optional[AttributionFiguresData]

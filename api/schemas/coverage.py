from datetime import date
from typing import Optional

from pydantic import BaseModel


class YearCoverageData(BaseModel):
    year: int
    report_count: int
    text_report_count: int


class GetCoverageResponse(BaseModel):
    report_count: int
    text_report_count: int
    speech_count: int
    linked_speech_count: int
    person_count: int
    membership_count: int
    sitting_count: int
    attendance_count: int
    linked_attendance_count: int
    text_first_sitting_date: Optional[date]
    text_last_sitting_date: Optional[date]
    attendance_last_sitting_date: Optional[date]
    years: list[YearCoverageData]

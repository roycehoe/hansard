from datetime import date
from typing import Optional

from pydantic import BaseModel


class SittingReportData(BaseModel):
    report_slug: str
    title: str
    subtitle: str
    report_type: str
    speech_number: int
    is_text_available: bool


class AttendanceData(BaseModel):
    name: str
    is_present: bool
    constituency: str
    person_id: Optional[int]
    person_slug: str
    person_name: str


class GetSittingResponse(BaseModel):
    sitting_date: date
    parliament_number: int
    volume_number: int
    sitting_number: Optional[int]
    session_number: Optional[int]
    reports: list[SittingReportData]
    is_attendance_available: bool
    attendance: list[AttendanceData]


class SittingData(BaseModel):
    sitting_date: date
    parliament_number: int
    volume_number: int
    sitting_number: Optional[int]
    session_number: Optional[int]
    report_count: int


class GetAllSittingsResponse(BaseModel):
    sittings: list[SittingData]

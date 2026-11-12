from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import ActHistoryEntryKind, BillLinkSource, BillStage


class ActSummaryData(BaseModel):
    sso_code: str
    title: str


class GetAllActsResponse(BaseModel):
    acts: list[ActSummaryData]


class ActEntryReportData(BaseModel):
    report_slug: str
    title: str
    report_type: str
    sitting_date: date
    stages: list[BillStage]


class ActEntryBillData(BaseModel):
    bill_key: str
    title: str
    first_sitting_date: date
    last_sitting_date: date
    is_passed: bool
    act_count: int
    reports: list[ActEntryReportData]


class ActEntryData(BaseModel):
    ordinal: int
    kind: ActHistoryEntryKind
    printed_title: str
    printed_law_number: str
    printed_bill_number: Optional[str]
    first_reading_date: Optional[date]
    second_reading_date: Optional[date]
    third_reading_date: Optional[date]
    commencement_date: Optional[date]
    bill_link_source: Optional[BillLinkSource]
    bill: Optional[ActEntryBillData]


class GetActResponse(BaseModel):
    sso_code: str
    title: str
    entries: list[ActEntryData]


class ActPersonBillData(BaseModel):
    bill_key: str
    title: str
    act_count: int
    printed_speakers: list[str]
    reading_speech_count: int
    budget_debate_speech_count: int


class ActPersonData(BaseModel):
    person_id: int
    person_slug: str
    canonical_name: str
    bill_count: int
    bills: list[ActPersonBillData]


class GetActPeopleResponse(BaseModel):
    people: list[ActPersonData]
    page: int
    page_size: int
    has_next_page: bool
    total_count: int

from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import BillLinkSource, BillReportRole, BillStage


class BillStageLineData(BaseModel):
    stage: BillStage
    printed_text: str
    ordinal: int


class BillReportData(BaseModel):
    report_slug: str
    title: str
    report_type: str
    sitting_date: date
    role: BillReportRole
    stage_lines: list[BillStageLineData]


class BillActData(BaseModel):
    sso_code: str
    title: str
    printed_title: str
    printed_law_number: str
    bill_link_source: Optional[BillLinkSource]


class BillPersonData(BaseModel):
    person_id: int
    person_slug: str
    canonical_name: str
    printed_speakers: list[str]
    reading_speech_count: int
    budget_debate_speech_count: int


class GetBillResponse(BaseModel):
    bill_key: str
    title: str
    first_sitting_date: date
    last_sitting_date: date
    is_passed: bool
    act_count: int
    reports: list[BillReportData]
    acts: list[BillActData]
    people: list[BillPersonData]


class PersonBillData(BaseModel):
    bill_key: str
    title: str
    first_sitting_date: date
    last_sitting_date: date
    is_passed: bool
    act_count: int
    printed_speakers: list[str]
    reading_speech_count: int
    budget_debate_speech_count: int
    reading_report_count: int
    budget_debate_report_count: int


class GetPersonBillsResponse(BaseModel):
    bills: list[PersonBillData]
    page: int
    page_size: int
    has_next_page: bool
    total_count: int

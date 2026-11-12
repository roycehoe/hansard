from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from enums import AttendanceOfficeSource, OfficeClass, OfficeTitleMinistrySource


class MinistrySummaryData(BaseModel):
    id: int
    name: str
    title_count: int
    put_to_report_count: int
    answered_by_report_count: int


class GetAllMinistriesResponse(BaseModel):
    ministries: list[MinistrySummaryData]


class MinistryTitleData(BaseModel):
    office_printed: str
    source: OfficeTitleMinistrySource


class MinistrySeeAlsoData(BaseModel):
    ministry_id: int
    name: str
    note: str
    source_url: str


class GetMinistryResponse(BaseModel):
    id: int
    name: str
    titles: list[MinistryTitleData]
    see_also: list[MinistrySeeAlsoData]


class MinistryReferenceData(BaseModel):
    id: int
    name: str


class PutToData(BaseModel):
    ordinal: int
    office_printed: str
    printed_text: str
    ministries: list[MinistryReferenceData]


class AnsweredByData(BaseModel):
    ordinal: int
    printed_name: str
    membership_id: Optional[int]
    office_printed: str
    office_class: Optional[OfficeClass]
    answering_for_printed: str
    ministries: list[MinistryReferenceData]


class MinistryQuestionData(BaseModel):
    report_slug: str
    title: str
    sitting_date: date
    report_type: str
    put_to: list[PutToData]
    answered_by: list[AnsweredByData]


class GetMinistryQuestionsResponse(BaseModel):
    total_count: int
    questions: list[MinistryQuestionData]


class PrintEvidenceData(BaseModel):
    sitting_date: date
    entry_line_printed: str
    source: AttendanceOfficeSource
    extracted_at: datetime


class PrintedRangeData(BaseModel):
    office_printed: str
    office_class: OfficeClass
    sitting_count: int
    first_print: PrintEvidenceData
    last_print: PrintEvidenceData


class GetMembershipPrintedRangesResponse(BaseModel):
    membership_id: int
    ranges: list[PrintedRangeData]


class GetReportOfficesResponse(BaseModel):
    put_to: list[PutToData]
    answered_by: list[AnsweredByData]

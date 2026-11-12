from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import (
    LeaveEntryFormat,
    LeaveNameSource,
    LeaveOfficeSource,
    LeaveYearSource,
)


class LeavePrintingData(BaseModel):
    sitting_date: date
    entry_format: LeaveEntryFormat
    name_source: LeaveNameSource
    year_source: Optional[LeaveYearSource]
    printed_name: Optional[str]
    carried_name: Optional[str]
    printed_from: Optional[str]
    printed_to: Optional[str]
    printed_line: Optional[str]
    printed_heading_from: Optional[str]
    printed_heading_to: Optional[str]
    office_printed: Optional[str]
    office_source: Optional[LeaveOfficeSource]
    is_covering_sitting: Optional[bool]


class PersonLeavePeriodData(BaseModel):
    name: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    end_text: Optional[str]
    printings: list[LeavePrintingData]


class GetPersonLeavePeriodsResponse(BaseModel):
    leave_periods: list[PersonLeavePeriodData]


class LatestSittingLeaveData(BaseModel):
    person_id: Optional[int]
    person_name: Optional[str]
    name: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    end_text: Optional[str]
    printed_name: Optional[str]
    carried_name: Optional[str]
    printed_from: Optional[str]
    printed_to: Optional[str]
    office_printed: Optional[str]
    office_source: Optional[LeaveOfficeSource]


class GetLatestSittingLeavePeriodsResponse(BaseModel):
    sitting_date: date
    leave_periods: list[LatestSittingLeaveData]

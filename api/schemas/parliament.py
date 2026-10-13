from datetime import date

from pydantic import BaseModel


class ParliamentData(BaseModel):
    parliament_number: int
    sitting_count: int
    report_count: int
    text_report_count: int
    first_sitting_date: date
    last_sitting_date: date


class GetAllParliamentsResponse(BaseModel):
    parliaments: list[ParliamentData]

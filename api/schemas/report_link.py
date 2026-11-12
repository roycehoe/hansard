from datetime import date

from pydantic import BaseModel

from enums import ReportLinkRelation


class ReportLinkData(BaseModel):
    relation: ReportLinkRelation
    report_slug: str
    title: str
    subtitle: str
    report_type: str
    sitting_date: date
    printed_citation: str


class GetReportLinksResponse(BaseModel):
    links: list[ReportLinkData]

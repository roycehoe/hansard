from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import DatePrecision


class PartyAffiliationSourceReportData(BaseModel):
    report_slug: str
    sitting_date: date


class PartyAffiliationData(BaseModel):
    party: str
    started_on: date
    started_on_precision: DatePrecision
    is_started_on_upper_bound: bool
    event: str
    source_url: Optional[str]
    source_report: Optional[PartyAffiliationSourceReportData]


class MembershipData(BaseModel):
    parliament_number: int
    party: str
    party_affiliations: list[PartyAffiliationData]
    is_legislative_assembly: bool
    is_member: bool
    constituencies: list[str]


class PersonData(BaseModel):
    person_id: int
    person_slug: str
    canonical_name: str
    name_variants: list[str]
    memberships: list[MembershipData]


class GetAllPersonsResponse(BaseModel):
    persons: list[PersonData]


class PersonMembershipData(BaseModel):
    parliament_number: int
    party: str
    party_affiliations: list[PartyAffiliationData]
    is_legislative_assembly: bool
    is_member: bool
    constituencies: list[str]


class ParliamentCountData(BaseModel):
    parliament_number: int
    speech_count: int
    present_count: int
    absent_count: int


class GetPersonResponse(BaseModel):
    person_id: int
    person_slug: str
    canonical_name: str
    name_variants: list[str]
    memberships: list[PersonMembershipData]
    parliament_counts: list[ParliamentCountData]


class PersonReportData(BaseModel):
    report_slug: str
    title: str
    subtitle: str
    report_type: str
    sitting_date: date
    parliament_number: int
    speech_count: int


class GetPersonReportsResponse(BaseModel):
    reports: list[PersonReportData]
    page: int
    page_size: int
    has_next_page: bool
    total_count: int


class GetAllPartiesResponse(BaseModel):
    parties: list[str]

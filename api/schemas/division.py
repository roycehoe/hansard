from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import (
    DivisionCountSource,
    DivisionListStatus,
    DivisionVoteChoice,
    DivisionVoteListSource,
    MinutesDivisionPairing,
)


class DivisionData(BaseModel):
    id: int
    sitting_date: date
    parliament_number: int
    report_slug: Optional[str]
    report_title: Optional[str]
    speech_ordinal: Optional[int]
    count_source: DivisionCountSource
    printed_counts: str
    ayes: Optional[int]
    noes: Optional[int]
    abstentions: Optional[int]
    absent: Optional[int]
    paired: Optional[int]
    list_status: DivisionListStatus


class GetAllDivisionsResponse(BaseModel):
    divisions: list[DivisionData]
    page: int
    page_size: int
    has_next_page: bool
    total_count: int


class DivisionVoteData(BaseModel):
    printed_name: str
    vote_choice: DivisionVoteChoice
    list_source: DivisionVoteListSource
    membership_id: Optional[int]
    party: Optional[str]
    is_party_uncertain: bool


class DivisionPartyCountData(BaseModel):
    list_source: DivisionVoteListSource
    vote_choice: DivisionVoteChoice
    party: Optional[str]
    member_count: int
    uncertain_member_count: int


class DivisionMinutesData(BaseModel):
    sitting_date: date
    printed_counts: str
    printed_label: Optional[str]
    file_url: Optional[str]
    pairing: MinutesDivisionPairing
    list_status: DivisionListStatus
    printed_list: Optional[str]


class GetDivisionResponse(BaseModel):
    id: int
    sitting_date: date
    parliament_number: int
    report_slug: Optional[str]
    report_title: Optional[str]
    speech_ordinal: Optional[int]
    count_source: DivisionCountSource
    printed_counts: str
    ayes: Optional[int]
    noes: Optional[int]
    abstentions: Optional[int]
    absent: Optional[int]
    paired: Optional[int]
    list_status: DivisionListStatus
    printed_list: Optional[str]
    votes: list[DivisionVoteData]
    party_counts: list[DivisionPartyCountData]
    minutes: Optional[DivisionMinutesData]

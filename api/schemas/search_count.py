from datetime import date, datetime

from pydantic import BaseModel

from enums import SearchEndpoint


class SearchCountData(BaseModel):
    counted_on: date
    endpoint: SearchEndpoint
    search_count: int
    refusal_count: int


class GetSearchCountsResponse(BaseModel):
    counted_since: datetime
    counts: list[SearchCountData]

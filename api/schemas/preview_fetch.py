from datetime import date, datetime

from pydantic import BaseModel


class PreviewFetchData(BaseModel):
    fetched_on: date
    bot_name: str
    path: str
    fetch_count: int


class GetPreviewFetchesResponse(BaseModel):
    counted_since: datetime
    fetches: list[PreviewFetchData]

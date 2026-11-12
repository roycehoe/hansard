from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import MinutesFileFormat, MinutesStatus


class MinutesData(BaseModel):
    sitting_date: date
    status: MinutesStatus
    printed_label: Optional[str]
    printed_parliament: Optional[str]
    file_url: Optional[str]
    archive_timestamp: Optional[str]
    file_format: Optional[MinutesFileFormat]


class GetAllMinutesResponse(BaseModel):
    minutes: list[MinutesData]
    page: int
    page_size: int
    has_next_page: bool
    total_count: int

from datetime import date
from typing import Optional

from pydantic import BaseModel

from enums import PreviewType


class PreviewData(BaseModel):
    title: str
    description: str
    preview_type: PreviewType
    path: str
    is_found: bool
    report_title: str
    sitting_date: Optional[date]

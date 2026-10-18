from pydantic import BaseModel

from enums import PreviewType


class PreviewData(BaseModel):
    title: str
    description: str
    preview_type: PreviewType
    path: str

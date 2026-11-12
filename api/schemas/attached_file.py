from typing import Optional

from pydantic import BaseModel

from enums import AttachedFileKind


class AttachedFileData(BaseModel):
    kind: AttachedFileKind
    printed_title: str
    file_name: str
    section_type: Optional[str]


class AttachedFilePointerData(BaseModel):
    ordinal: int
    printed_text: str
    url: Optional[str]
    speech_ordinal: Optional[int]
    file: Optional[AttachedFileData]


class GetReportAttachedFilesResponse(BaseModel):
    pointers: list[AttachedFilePointerData]

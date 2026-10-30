from typing import Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session

from database.engine import get_search_session, get_session
from schemas.report import GetReportMatchedWordsResponse, GetReportResponse
from services import report as report_service

_MAX_SPEECH_ANCHOR_LENGTH = 200
_MAX_WORDS_LENGTH = 512
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{report_slug}", status_code=200)
def get_report(
    report_slug: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    speech_ordinal: Optional[int] = Query(default=None, alias="s", ge=0),
    speech_anchor: Optional[str] = Query(
        default=None, alias="q", max_length=_MAX_SPEECH_ANCHOR_LENGTH
    ),
    session: Session = Depends(get_session),
) -> GetReportResponse:
    return report_service.get_report(
        report_slug, speech_ordinal, speech_anchor, session
    )


@router.get("/{report_slug}/matched-words", status_code=200)
def get_report_matched_words(
    report_slug: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    words: str = Query(
        alias="q", max_length=_MAX_WORDS_LENGTH, pattern=_NO_NUL_BYTE_PATTERN
    ),
    session: Session = Depends(get_search_session),
) -> GetReportMatchedWordsResponse:
    return report_service.get_report_matched_words(report_slug, words, session)

from typing import Optional

from fastapi import APIRouter, Depends, Path, Query, Response
from sqlmodel import Session

from database.engine import get_search_session, get_session
from schemas.report import GetReportMatchedWordsResponse, GetReportResponse
from services import report as report_service
from validators.search import validate_can_get_report_matched_words

_MAX_SPEECH_ANCHOR_LENGTH = 200
_MAX_WORDS_LENGTH = 512
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"
_SHA256_PATTERN = r"^[0-9a-f]{64}$"
_CACHE_CONTROL_HEADER = "Cache-Control"
_IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable"

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
    validate_can_get_report_matched_words(words)
    return report_service.get_report_matched_words(report_slug, words, session)


@router.get("/{report_slug}/pictures/{sha256}", status_code=200)
def get_report_picture(
    report_slug: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    sha256: str = Path(pattern=_SHA256_PATTERN),
    session: Session = Depends(get_session),
) -> Response:
    media_type, picture_bytes = report_service.get_report_picture(
        report_slug, sha256, session
    )
    return Response(
        picture_bytes,
        media_type=media_type,
        headers={_CACHE_CONTROL_HEADER: _IMMUTABLE_CACHE_CONTROL},
    )

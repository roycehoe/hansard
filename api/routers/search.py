from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database.engine import get_search_session
from enums import ReportType, SearchSort
from schemas.search import SearchReportsResponse, SearchSpeechesResponse
from services import search as search_service
from validators.request_limits import (
    EARLIEST_SEARCH_DATE,
    LATEST_SEARCH_DATE,
    MAX_ACT_SSO_CODE_LENGTH,
    MAX_CONSTITUENCY_LENGTH,
    MAX_INTEGER_COLUMN_VALUE,
    MAX_SEARCH_QUERY_LENGTH,
    NO_NUL_BYTE_PATTERN,
)
from validators.search import validate_can_search_reports, validate_can_search_speeches

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100
_MAX_REPORT_SLUG_LENGTH = 200

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/speeches", status_code=200)
def search_speeches(
    query: str = Query(
        default="",
        alias="q",
        max_length=MAX_SEARCH_QUERY_LENGTH,
        pattern=NO_NUL_BYTE_PATTERN,
    ),
    parliament_number: Optional[int] = Query(
        default=None, ge=0, le=MAX_INTEGER_COLUMN_VALUE
    ),
    date_from: Optional[date] = Query(
        default=None, ge=EARLIEST_SEARCH_DATE, le=LATEST_SEARCH_DATE
    ),
    date_to: Optional[date] = Query(
        default=None, ge=EARLIEST_SEARCH_DATE, le=LATEST_SEARCH_DATE
    ),
    report_type: Optional[ReportType] = None,
    person_id: Optional[int] = Query(default=None, ge=1, le=MAX_INTEGER_COLUMN_VALUE),
    constituency: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=MAX_CONSTITUENCY_LENGTH,
        pattern=NO_NUL_BYTE_PATTERN,
    ),
    report_slug: Optional[str] = Query(
        default=None,
        alias="report",
        max_length=_MAX_REPORT_SLUG_LENGTH,
        pattern=NO_NUL_BYTE_PATTERN,
    ),
    act_sso_code: Optional[str] = Query(
        default=None,
        alias="act",
        max_length=MAX_ACT_SSO_CODE_LENGTH,
        pattern=NO_NUL_BYTE_PATTERN,
    ),
    sort: SearchSort = SearchSort.RELEVANCE,
    page: int = Query(default=1, ge=1, le=search_service.MAX_SEARCH_PAGE),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    session: Session = Depends(get_search_session),
) -> SearchSpeechesResponse:
    validate_can_search_speeches(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        person_id,
        constituency,
        act_sso_code,
    )
    return search_service.search_speeches(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        person_id,
        constituency,
        report_slug,
        act_sso_code,
        sort,
        page,
        page_size,
        session,
    )


@router.get("/reports", status_code=200)
def search_reports(
    query: str = Query(
        default="",
        alias="q",
        max_length=MAX_SEARCH_QUERY_LENGTH,
        pattern=NO_NUL_BYTE_PATTERN,
    ),
    parliament_number: Optional[int] = Query(
        default=None, ge=0, le=MAX_INTEGER_COLUMN_VALUE
    ),
    date_from: Optional[date] = Query(
        default=None, ge=EARLIEST_SEARCH_DATE, le=LATEST_SEARCH_DATE
    ),
    date_to: Optional[date] = Query(
        default=None, ge=EARLIEST_SEARCH_DATE, le=LATEST_SEARCH_DATE
    ),
    report_type: Optional[ReportType] = None,
    is_text_available: Optional[bool] = None,
    sort: SearchSort = SearchSort.RELEVANCE,
    page: int = Query(default=1, ge=1, le=search_service.MAX_SEARCH_PAGE),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    session: Session = Depends(get_search_session),
) -> SearchReportsResponse:
    validate_can_search_reports(
        query, parliament_number, date_from, date_to, report_type, is_text_available
    )
    return search_service.search_reports(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        is_text_available,
        sort,
        page,
        page_size,
        session,
    )

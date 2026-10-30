from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database.engine import get_search_session
from enums import ReportType, SearchSort
from schemas.search import SearchReportsResponse, SearchSpeechesResponse
from services import search as search_service
from validators.search import validate_can_search_reports, validate_can_search_speeches

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100
_MAX_QUERY_LENGTH = 256
_MAX_REPORT_SLUG_LENGTH = 200
_MAX_CONSTITUENCY_LENGTH = 100
_EARLIEST_SEARCH_DATE = date(1900, 1, 1)
_LATEST_SEARCH_DATE = date(2100, 12, 31)
_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/speeches", status_code=200)
def search_speeches(
    query: str = Query(
        default="",
        alias="q",
        max_length=_MAX_QUERY_LENGTH,
        pattern=_NO_NUL_BYTE_PATTERN,
    ),
    parliament_number: Optional[int] = Query(
        default=None, ge=0, le=_MAX_INTEGER_COLUMN_VALUE
    ),
    date_from: Optional[date] = Query(
        default=None, ge=_EARLIEST_SEARCH_DATE, le=_LATEST_SEARCH_DATE
    ),
    date_to: Optional[date] = Query(
        default=None, ge=_EARLIEST_SEARCH_DATE, le=_LATEST_SEARCH_DATE
    ),
    report_type: Optional[ReportType] = None,
    person_id: Optional[int] = Query(default=None, ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    constituency: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=_MAX_CONSTITUENCY_LENGTH,
        pattern=_NO_NUL_BYTE_PATTERN,
    ),
    report_slug: Optional[str] = Query(
        default=None,
        alias="report",
        max_length=_MAX_REPORT_SLUG_LENGTH,
        pattern=_NO_NUL_BYTE_PATTERN,
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
        max_length=_MAX_QUERY_LENGTH,
        pattern=_NO_NUL_BYTE_PATTERN,
    ),
    parliament_number: Optional[int] = Query(
        default=None, ge=0, le=_MAX_INTEGER_COLUMN_VALUE
    ),
    date_from: Optional[date] = Query(
        default=None, ge=_EARLIEST_SEARCH_DATE, le=_LATEST_SEARCH_DATE
    ),
    date_to: Optional[date] = Query(
        default=None, ge=_EARLIEST_SEARCH_DATE, le=_LATEST_SEARCH_DATE
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

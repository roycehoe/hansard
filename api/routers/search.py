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
_MAX_QUERY_LENGTH = 200

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/speeches", status_code=200)
def search_speeches(
    query: str = Query(default="", alias="q", max_length=_MAX_QUERY_LENGTH),
    parliament_number: Optional[int] = Query(default=None, ge=0),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    report_type: Optional[ReportType] = None,
    person_id: Optional[int] = Query(default=None, ge=1),
    sort: SearchSort = SearchSort.RELEVANCE,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    session: Session = Depends(get_search_session),
) -> SearchSpeechesResponse:
    validate_can_search_speeches(
        query, parliament_number, date_from, date_to, report_type, person_id
    )
    return search_service.search_speeches(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        person_id,
        sort,
        page,
        page_size,
        session,
    )


@router.get("/reports", status_code=200)
def search_reports(
    query: str = Query(default="", alias="q", max_length=_MAX_QUERY_LENGTH),
    parliament_number: Optional[int] = Query(default=None, ge=0),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    report_type: Optional[ReportType] = None,
    is_text_available: Optional[bool] = None,
    sort: SearchSort = SearchSort.RELEVANCE,
    page: int = Query(default=1, ge=1),
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

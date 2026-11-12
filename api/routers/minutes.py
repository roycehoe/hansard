from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database.engine import get_session
from enums import MinutesStatus
from schemas.minutes import GetAllMinutesResponse
from services import minutes as minutes_service
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100
_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647

router = APIRouter(
    prefix="/minutes",
    tags=["minutes"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("", status_code=200)
def get_all_minutes(
    page: int = Query(default=1, ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    status: Optional[MinutesStatus] = Query(default=None),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    session: Session = Depends(get_session),
) -> GetAllMinutesResponse:
    return minutes_service.get_all_minutes(
        page, page_size, status, date_from, date_to, session
    )

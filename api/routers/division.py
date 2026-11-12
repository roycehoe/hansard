from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session

from database.engine import get_session
from schemas.division import GetAllDivisionsResponse, GetDivisionResponse
from services import division as division_service
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100
_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(
    prefix="/divisions",
    tags=["divisions"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("", status_code=200)
def get_all_divisions(
    page: int = Query(default=1, ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    parliament_number: Optional[int] = Query(
        default=None, ge=0, le=_MAX_INTEGER_COLUMN_VALUE
    ),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    report_slug: Optional[str] = Query(
        default=None, min_length=1, pattern=_NO_NUL_BYTE_PATTERN
    ),
    session: Session = Depends(get_session),
) -> GetAllDivisionsResponse:
    return division_service.get_all_divisions(
        page, page_size, parliament_number, date_from, date_to, report_slug, session
    )


@router.get("/{division_id}", status_code=200)
def get_division(
    division_id: int = Path(ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    session: Session = Depends(get_session),
) -> GetDivisionResponse:
    return division_service.get_division(division_id, session)

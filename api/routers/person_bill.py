from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session

from database.engine import get_session
from schemas.bill import GetPersonBillsResponse
from services import bill as bill_service

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100
_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647

router = APIRouter(prefix="/people", tags=["people"])


@router.get("/{person_id}/bills", status_code=200)
def get_person_bills(
    person_id: int = Path(ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    page: int = Query(default=1, ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    session: Session = Depends(get_session),
) -> GetPersonBillsResponse:
    return bill_service.get_person_bills(person_id, page, page_size, session)

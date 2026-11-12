from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database.engine import get_session
from schemas.seat import GetSeatHistoryResponse
from services import seat as seat_service
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(
    prefix="/seats",
    tags=["seats"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("", status_code=200)
def get_seat_history(
    constituency: str = Query(min_length=1, pattern=_NO_NUL_BYTE_PATTERN),
    session: Session = Depends(get_session),
) -> GetSeatHistoryResponse:
    return seat_service.get_seat_history(constituency, session)

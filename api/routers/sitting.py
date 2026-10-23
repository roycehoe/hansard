from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database.engine import get_session
from schemas.sitting import GetAllSittingsResponse, GetSittingResponse
from services import sitting as sitting_service

_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647

router = APIRouter(prefix="/sittings", tags=["sittings"])


@router.get("", status_code=200)
def get_all_sittings(
    parliament_number: int = Query(ge=0, le=_MAX_INTEGER_COLUMN_VALUE),
    session: Session = Depends(get_session),
) -> GetAllSittingsResponse:
    return sitting_service.get_all_sittings(parliament_number, session)


@router.get("/{sitting_date}", status_code=200)
def get_sitting(
    sitting_date: date, session: Session = Depends(get_session)
) -> GetSittingResponse:
    return sitting_service.get_sitting(sitting_date, session)

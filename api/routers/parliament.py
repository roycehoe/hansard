from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.engine import get_session
from schemas.parliament import GetAllParliamentsResponse
from services import parliament as parliament_service

router = APIRouter(prefix="/parliaments", tags=["parliaments"])


@router.get("", status_code=200)
def get_all_parliaments(
    session: Session = Depends(get_session),
) -> GetAllParliamentsResponse:
    return parliament_service.get_all_parliaments(session)

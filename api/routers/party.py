from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.engine import get_session
from schemas.person import GetAllPartiesResponse
from services import person as person_service

router = APIRouter(prefix="/parties", tags=["parties"])


@router.get("", status_code=200)
def get_all_parties(
    session: Session = Depends(get_session),
) -> GetAllPartiesResponse:
    return person_service.get_all_parties(session)

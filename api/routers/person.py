from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database.engine import get_session
from schemas.person import (
    GetAllPersonsResponse,
    GetPersonReportsResponse,
    GetPersonResponse,
)
from services import person as person_service

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100

router = APIRouter(prefix="/people")


@router.get("")
def get_all_persons(
    parliament_number: Optional[int] = Query(default=None, ge=0),
    party: Optional[str] = Query(default=None, min_length=1),
    name: Optional[str] = Query(default=None, min_length=1),
    session: Session = Depends(get_session),
) -> GetAllPersonsResponse:
    return person_service.get_all_persons(parliament_number, party, name, session)


@router.get("/{person_id}")
def get_person(
    person_id: int, session: Session = Depends(get_session)
) -> GetPersonResponse:
    return person_service.get_person(person_id, session)


@router.get("/{person_id}/reports")
def get_person_reports(
    person_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    session: Session = Depends(get_session),
) -> GetPersonReportsResponse:
    return person_service.get_person_reports(person_id, page, page_size, session)

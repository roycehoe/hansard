from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session

from database.engine import get_session
from schemas.act import GetActPeopleResponse, GetActResponse
from services import act as act_service
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100
_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(
    prefix="/acts",
    tags=["acts"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/{sso_code}", status_code=200)
def get_act(
    sso_code: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    session: Session = Depends(get_session),
) -> GetActResponse:
    return act_service.get_act(sso_code, session)


@router.get("/{sso_code}/people", status_code=200)
def get_act_people(
    sso_code: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    page: int = Query(default=1, ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    session: Session = Depends(get_session),
) -> GetActPeopleResponse:
    return act_service.get_act_people(sso_code, page, page_size, session)

from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session

from database.engine import get_session
from enums import MinistryQuestionRelation
from schemas.office import (
    GetAllMinistriesResponse,
    GetMembershipPrintedRangesResponse,
    GetMinistryQuestionsResponse,
    GetMinistryResponse,
    GetReportOfficesResponse,
)
from services import office as office_service
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_DEFAULT_PAGE_SIZE = 20
_MAX_PAGE_SIZE = 100
_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(
    prefix="/offices",
    tags=["offices"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/ministries", status_code=200)
def get_all_ministries(
    session: Session = Depends(get_session),
) -> GetAllMinistriesResponse:
    return office_service.get_all_ministries(session)


@router.get("/ministries/{ministry_id}", status_code=200)
def get_ministry(
    ministry_id: int = Path(ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    session: Session = Depends(get_session),
) -> GetMinistryResponse:
    return office_service.get_ministry(ministry_id, session)


@router.get("/ministries/{ministry_id}/questions", status_code=200)
def get_ministry_questions(
    ministry_id: int = Path(ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    relation: MinistryQuestionRelation = Query(alias="by"),
    page: int = Query(default=1, ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE),
    session: Session = Depends(get_session),
) -> GetMinistryQuestionsResponse:
    return office_service.get_ministry_questions(
        ministry_id, relation, page, page_size, session
    )


@router.get("/memberships/{membership_id}/printed-ranges", status_code=200)
def get_membership_printed_ranges(
    membership_id: int = Path(ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    session: Session = Depends(get_session),
) -> GetMembershipPrintedRangesResponse:
    return office_service.get_membership_printed_ranges(membership_id, session)


@router.get("/reports/{report_slug}", status_code=200)
def get_report_offices(
    report_slug: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    session: Session = Depends(get_session),
) -> GetReportOfficesResponse:
    return office_service.get_report_offices(report_slug, session)

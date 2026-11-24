from fastapi import APIRouter, Depends, Path
from sqlmodel import Session

from database.engine import get_session
from schemas.leave_period import (
    GetLatestSittingLeavePeriodsResponse,
    GetPersonLeavePeriodsResponse,
)
from services import leave_period as leave_period_service
from validators.request_limits import MAX_INTEGER_COLUMN_VALUE
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

router = APIRouter(
    tags=["leave-periods"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/people/{person_id}/leave-periods", status_code=200)
def get_person_leave_periods(
    person_id: int = Path(ge=1, le=MAX_INTEGER_COLUMN_VALUE),
    session: Session = Depends(get_session),
) -> GetPersonLeavePeriodsResponse:
    return leave_period_service.get_person_leave_periods(person_id, session)


@router.get("/leave-periods/latest-sitting", status_code=200)
def get_latest_sitting_leave_periods(
    session: Session = Depends(get_session),
) -> GetLatestSittingLeavePeriodsResponse:
    return leave_period_service.get_latest_sitting_leave_periods(session)

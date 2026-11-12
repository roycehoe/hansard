from fastapi import APIRouter, Depends, Path
from sqlmodel import Session

from database.engine import get_session
from schemas.leave_period import GetPersonLeavePeriodsResponse
from services import leave_period as leave_period_service
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647

router = APIRouter(
    tags=["leave-periods"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/people/{person_id}/leave-periods", status_code=200)
def get_person_leave_periods(
    person_id: int = Path(ge=1, le=_MAX_INTEGER_COLUMN_VALUE),
    session: Session = Depends(get_session),
) -> GetPersonLeavePeriodsResponse:
    return leave_period_service.get_person_leave_periods(person_id, session)

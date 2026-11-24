from fastapi import APIRouter, Depends, Path
from sqlmodel import Session

from database.engine import get_session
from schemas.office import GetPersonPrintedRangesResponse
from services import office as office_service
from validators.request_limits import MAX_INTEGER_COLUMN_VALUE
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

router = APIRouter(
    prefix="/people",
    tags=["people"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/{person_id}/printed-ranges", status_code=200)
def get_person_printed_ranges(
    person_id: int = Path(ge=1, le=MAX_INTEGER_COLUMN_VALUE),
    session: Session = Depends(get_session),
) -> GetPersonPrintedRangesResponse:
    return office_service.get_person_printed_ranges(person_id, session)

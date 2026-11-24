from fastapi import APIRouter, Depends, Path
from sqlmodel import Session

from database.engine import get_session
from schemas.bill import GetBillResponse
from services import bill as bill_service
from validators.request_limits import NO_NUL_BYTE_PATTERN
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

router = APIRouter(
    prefix="/bills",
    tags=["bills"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/{report_slug}", status_code=200)
def get_bill(
    report_slug: str = Path(pattern=NO_NUL_BYTE_PATTERN),
    session: Session = Depends(get_session),
) -> GetBillResponse:
    return bill_service.get_bill(report_slug, session)

from fastapi import APIRouter, Depends, Path
from sqlmodel import Session

from database.engine import get_session
from schemas.report_link import GetReportLinksResponse
from services import report as report_service
from validators.request_limits import NO_NUL_BYTE_PATTERN
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/{report_slug}/links", status_code=200)
def get_report_links(
    report_slug: str = Path(pattern=NO_NUL_BYTE_PATTERN),
    session: Session = Depends(get_session),
) -> GetReportLinksResponse:
    return report_service.get_report_links(report_slug, session)

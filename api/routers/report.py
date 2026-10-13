from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.engine import get_session
from schemas.report import GetReportResponse
from services import report as report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{report_slug}", status_code=200)
def get_report(
    report_slug: str, session: Session = Depends(get_session)
) -> GetReportResponse:
    return report_service.get_report(report_slug, session)

from datetime import date

from fastapi import APIRouter, Depends, Path
from sqlmodel import Session

from database.engine import get_session
from schemas.attached_file import (
    GetReportAttachedFilesResponse,
    GetSittingAttachedFilesResponse,
)
from services import attached_file as attached_file_service
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(
    tags=["attached-files"],
    dependencies=[Depends(validate_can_read_unreleased_endpoint)],
)


@router.get("/reports/{report_slug}/attached-files", status_code=200)
def get_report_attached_files(
    report_slug: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    session: Session = Depends(get_session),
) -> GetReportAttachedFilesResponse:
    return attached_file_service.get_report_attached_files(report_slug, session)


@router.get("/sittings/{sitting_date}/attached-files", status_code=200)
def get_sitting_attached_files(
    sitting_date: date, session: Session = Depends(get_session)
) -> GetSittingAttachedFilesResponse:
    return attached_file_service.get_sitting_attached_files(sitting_date, session)

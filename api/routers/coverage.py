from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.engine import get_session
from schemas.coverage import GetCoverageResponse
from services import coverage as coverage_service

router = APIRouter(prefix="/coverage", tags=["coverage"])


@router.get("", status_code=200)
def get_coverage(
    session: Session = Depends(get_session),
    refresh_run_session: Session = Depends(get_session, use_cache=False),
) -> GetCoverageResponse:
    return coverage_service.get_coverage(session, refresh_run_session)

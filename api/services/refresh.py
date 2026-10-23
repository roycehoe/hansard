from typing import Optional

from psycopg.errors import InsufficientPrivilege, UndefinedTable
from sqlalchemy.exc import ProgrammingError
from sqlmodel import Session

from crud.refresh_run import CRUDRefreshRun
from database.refresh_run import RefreshRun
from enums import RefreshRunStatus
from schemas.refresh import GetRefreshResponse
from utils.singapore_date import get_singapore_date


def _get_empty_refresh_response() -> GetRefreshResponse:
    return GetRefreshResponse(latest_sitting_date=None, last_checked_date=None)


def _get_refresh_response(succeeded_run: Optional[RefreshRun]) -> GetRefreshResponse:
    if succeeded_run is None:
        return _get_empty_refresh_response()
    return GetRefreshResponse(
        latest_sitting_date=succeeded_run.latest_sitting_date_with_text,
        last_checked_date=None
        if succeeded_run.finished_at is None
        else get_singapore_date(succeeded_run.finished_at),
    )


def get_refresh(session: Session) -> GetRefreshResponse:
    try:
        succeeded_run = CRUDRefreshRun(session).get_latest_by_status(
            RefreshRunStatus.SUCCEEDED
        )
    except ProgrammingError as error:
        if isinstance(error.orig, UndefinedTable):
            return _get_empty_refresh_response()
        if isinstance(error.orig, InsufficientPrivilege):
            return _get_empty_refresh_response()
        raise
    return _get_refresh_response(succeeded_run)

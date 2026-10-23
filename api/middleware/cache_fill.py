from time import sleep
from typing import Optional

from psycopg.errors import InsufficientPrivilege, UndefinedTable
from sqlalchemy.exc import ProgrammingError
from sqlmodel import Session

from crud.refresh_run import CRUDRefreshRun
from database.engine import engine
from services import coverage as coverage_service
from services import parliament as parliament_service
from services import sitemap as sitemap_service

_REFRESH_RUN_CHECK_INTERVAL_SECONDS = 15 * 60


# NOTE: one session each, so a failure in one leaves the other's transaction clean
def _fill_coverage_parliament_and_sitemap_caches() -> None:
    with Session(engine) as session:
        coverage_service.fill_coverage_cache(session)
    with Session(engine) as session:
        parliament_service.fill_all_parliaments_cache(session)
    with Session(engine) as session:
        sitemap_service.fill_sitemap_cache(session)


def _get_latest_finished_run_id() -> Optional[int]:
    with Session(engine) as session:
        latest_with_finished_at = CRUDRefreshRun(session).get_latest_with_finished_at()
        if latest_with_finished_at is None:
            return None
        return latest_with_finished_at.id


def _get_filled_run_id_after_startup_fill(
    latest_finished_run_id: Optional[int],
) -> Optional[int]:
    try:
        _fill_coverage_parliament_and_sitemap_caches()
    except Exception:  # noqa: BLE001 a failed startup fill must not end the thread, or nothing recomputes until a restart
        return None
    return latest_finished_run_id


def _get_filled_run_id_after_check_and_recompute(
    filled_run_id: Optional[int],
) -> Optional[int]:
    try:
        latest_finished_run_id = _get_latest_finished_run_id()
        if latest_finished_run_id == filled_run_id:
            return filled_run_id
        _fill_coverage_parliament_and_sitemap_caches()
    except Exception:  # noqa: BLE001 a failed check or recompute must not end the thread, or nothing recomputes until a restart
        return filled_run_id
    return latest_finished_run_id


def fill_coverage_parliament_and_sitemap_caches_after_each_refresh() -> None:
    try:
        latest_finished_run_id = _get_latest_finished_run_id()
    except ProgrammingError as error:
        if isinstance(error.orig, UndefinedTable):
            _fill_coverage_parliament_and_sitemap_caches()
            return
        if isinstance(error.orig, InsufficientPrivilege):
            _fill_coverage_parliament_and_sitemap_caches()
            return
        latest_finished_run_id = None
    except Exception:  # noqa: BLE001 a failed first read must not stop the startup fill or the checks after it
        latest_finished_run_id = None
    filled_run_id = _get_filled_run_id_after_startup_fill(latest_finished_run_id)
    while True:
        sleep(_REFRESH_RUN_CHECK_INTERVAL_SECONDS)
        filled_run_id = _get_filled_run_id_after_check_and_recompute(filled_run_id)

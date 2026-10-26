import logging
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

logger = logging.getLogger(__name__)


def _fill_coverage_cache() -> None:
    with Session(engine) as session, Session(engine) as refresh_run_session:
        coverage_service.fill_coverage_cache(session, refresh_run_session)


def _fill_parliament_cache() -> None:
    with Session(engine) as session:
        parliament_service.fill_all_parliaments_cache(session)


def _fill_sitemap_cache() -> None:
    with Session(engine) as session:
        sitemap_service.fill_sitemap_cache(session)


# NOTE: one session each, so a failure in one leaves the other's transaction clean. Each fill runs in its own try so a failure does not stop the others, and the first failure is raised after all three have run, so the callers still retry at the next check
def _fill_coverage_parliament_and_sitemap_caches() -> None:
    errors_to_raise: list[Exception] = []
    for fill_cache in (
        _fill_coverage_cache,
        _fill_parliament_cache,
        _fill_sitemap_cache,
    ):
        try:
            fill_cache()
        except Exception as error_to_raise:  # noqa: BLE001 a failed fill must not stop the other fills
            logger.exception("cache fill failed fill=%s", fill_cache.__name__)
            errors_to_raise.append(error_to_raise)
    if errors_to_raise:
        raise errors_to_raise[0]


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

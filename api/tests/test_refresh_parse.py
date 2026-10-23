from datetime import date, datetime, timezone

from database.refresh_run import RefreshRun
from enums import RefreshRunStatus
from schemas.refresh import GetRefreshResponse
from services import refresh as refresh_service


def _get_run() -> RefreshRun:
    return RefreshRun(
        id=1,
        latest_sitting_date_with_text=date(2026, 10, 14),
        started_at=datetime(2026, 10, 18, 17, 0, tzinfo=timezone.utc),
        finished_at=datetime(2026, 10, 18, 17, 30, tzinfo=timezone.utc),
        status=RefreshRunStatus.SUCCEEDED,
    )


def test_no_run_gives_the_empty_response() -> None:
    assert refresh_service._get_refresh_response(None) == GetRefreshResponse(
        latest_sitting_date=None, last_checked_date=None
    )


def test_dates_come_from_the_run_in_singapore_time() -> None:
    run = _get_run()

    response = refresh_service._get_refresh_response(run)

    assert response.latest_sitting_date == date(2026, 10, 14)
    assert response.last_checked_date == date(2026, 10, 19)

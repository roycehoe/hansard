import json
from collections.abc import Callable, Generator
from datetime import date, datetime, timezone

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.sql.elements import TextClause
from sqlmodel import text

from crud.refresh_run import CRUDRefreshRun
from database.engine import engine
from enums import RefreshRunStatus
from services import coverage as coverage_service
from settings import settings

pytestmark = pytest.mark.database

_COUNT_COLUMNS = (
    "website_responses_added",
    "sitting_date_responses_added",
    "sittings_added",
    "reports_added",
    "speeches_added",
    "speeches_linked",
    "speeches_named_unlinked",
    "attendances_added",
    "attendances_linked",
    "reports_held_without_text",
    "reports_without_speech_rows",
    "reports_rechecked",
    "reports_changed",
)


def _get_insert_statement() -> TextClause:
    count_columns = ", ".join(_COUNT_COLUMNS)
    count_values = ", ".join("0" for _ in _COUNT_COLUMNS)
    return text(
        f"INSERT INTO refresh_run ({count_columns}, latest_sitting_date_with_text, "
        "figures, started_at, finished_at, status) "
        f"VALUES ({count_values}, :latest_sitting_date_with_text, "
        "CAST(:figures AS jsonb), :started_at, :finished_at, :status) RETURNING id"
    )


def _get_seed_figures() -> dict[str, object]:
    return {
        "measured_at": "2100-01-01T00:30:00+00:00",
        "groups": [
            {
                "group": "Parliaments 0 to 11",
                "linked_row_count": 90,
                "named_unlinked_row_count": 10,
                "row_count": 200,
                "linked_character_count": 300,
                "body_character_count": 400,
            }
        ],
    }


@pytest.fixture
def seeded_refresh_run_id() -> Generator[int, None, None]:
    writable_engine = create_engine(settings.database_url)
    try:
        with writable_engine.begin() as connection:
            if (
                connection.execute(
                    text("SELECT to_regclass('public.refresh_run')")
                ).scalar_one()
                is None
            ):
                pytest.skip("refresh_run is not on the scratch database")
            refresh_run_id = connection.execute(
                _get_insert_statement(),
                {
                    "latest_sitting_date_with_text": date(2026, 10, 14),
                    "figures": json.dumps(_get_seed_figures()),
                    "started_at": datetime(2100, 1, 1, tzinfo=timezone.utc),
                    "finished_at": datetime(2100, 1, 1, 1, tzinfo=timezone.utc),
                    "status": RefreshRunStatus.SUCCEEDED,
                },
            ).scalar_one()
        yield refresh_run_id
        with writable_engine.begin() as connection:
            connection.execute(
                text("DELETE FROM refresh_run WHERE id = :id"), {"id": refresh_run_id}
            )
    finally:
        writable_engine.dispose()


def test_a_seeded_succeeded_run_shows_in_the_refresh_response(
    api_client: TestClient, seeded_refresh_run_id: int
) -> None:
    response = api_client.get("/refresh")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["latest_sitting_date"] == "2026-10-14"
    assert body["last_checked_date"] == "2100-01-01"
    assert "figures" not in body
    assert response.headers["cache-control"] == "public, max-age=3600"


def test_a_seeded_succeeded_run_shows_in_the_coverage_attribution(
    api_client: TestClient,
    seeded_refresh_run_id: int,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(coverage_service, "_cached_coverage", None)

    response = api_client.get("/coverage")

    assert response.status_code == status.HTTP_200_OK
    attribution = response.json()["attribution"]
    assert attribution["measured_on"] == "2100-01-01"
    assert len(attribution["groups"]) == 1
    group = attribution["groups"][0]
    assert group["first_parliament_number"] == 0
    assert group["last_parliament_number"] == 11
    assert group["linked_row_count"] == 90
    assert group["speaker_label_row_count"] == 100
    assert group["row_count"] == 200
    assert group["named_linked_share"] == pytest.approx(0.9)
    assert group["all_linked_share"] == pytest.approx(0.45)
    assert group["text_share"] == pytest.approx(0.75)


def _read_a_missing_table(crud_refresh_run: CRUDRefreshRun, *_: object) -> None:
    crud_refresh_run.session.execute(text("SELECT * FROM no_such_refresh_run"))


def _time_out(crud_refresh_run: CRUDRefreshRun, *_: object) -> None:
    crud_refresh_run.session.execute(text("SET LOCAL statement_timeout = 1"))
    crud_refresh_run.session.execute(text("SELECT pg_sleep(1)"))


@pytest.mark.parametrize("failing_read", [_read_a_missing_table, _time_out])
def test_coverage_keeps_its_counts_when_refresh_run_cannot_be_read(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    failing_read: Callable[..., None],
) -> None:
    monkeypatch.setattr(coverage_service, "_cached_coverage", None)
    monkeypatch.setattr(
        CRUDRefreshRun, "get_latest_by_status_and_figures_type", failing_read
    )

    response = api_client.get("/coverage")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["attribution"] is None
    assert body["speech_count"] > 0


def test_the_refresh_response_is_empty_without_a_succeeded_run(
    api_client: TestClient,
) -> None:
    with engine.connect() as connection:
        table_name = connection.execute(
            text("SELECT to_regclass('public.refresh_run')")
        ).scalar_one()
        if table_name is not None:
            succeeded_count = connection.execute(
                text("SELECT count(*) FROM refresh_run WHERE status = :status"),
                {"status": RefreshRunStatus.SUCCEEDED},
            ).scalar_one()
            if succeeded_count > 0:
                pytest.skip("refresh_run already holds a SUCCEEDED run")

    response = api_client.get("/refresh")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "latest_sitting_date": None,
        "last_checked_date": None,
    }

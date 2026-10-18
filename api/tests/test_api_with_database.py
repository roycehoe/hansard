from urllib.parse import quote

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from database.engine import engine
from database.report import Report
from middleware import response_cache
from middleware.takedown import is_report_id_taken_down
from utils.report_slug import get_report_slug

pytestmark = pytest.mark.database

_REPORT_CANDIDATE_COUNT = 20


@pytest.fixture
def report_slug() -> str:
    with Session(engine) as session:
        report_ids = session.exec(
            select(Report.report_id).order_by(Report.id).limit(_REPORT_CANDIDATE_COUNT)
        ).all()
    return get_report_slug(
        next(
            report_id
            for report_id in report_ids
            if not is_report_id_taken_down(report_id)
        )
    )


def test_health_answers_200_with_no_cache_control(api_client: TestClient) -> None:
    response = api_client.get("/health")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "ok"}
    assert "cache-control" not in response.headers


def test_a_report_answers_200_with_public_cache_control(
    api_client: TestClient, report_slug: str
) -> None:
    url = f"/reports/{quote(report_slug, safe='')}"

    first = api_client.get(url)
    second = api_client.get(url)

    assert first.status_code == status.HTTP_200_OK
    assert first.headers["cache-control"] == "public, max-age=3600"
    assert second.headers["cache-control"] == "public, max-age=3600"
    assert second.content == first.content


def test_an_unknown_report_answers_404_with_no_cache_control(
    api_client: TestClient,
) -> None:
    first = api_client.get("/reports/no-such-report-slug")
    second = api_client.get("/reports/no-such-report-slug")

    assert first.status_code == status.HTTP_404_NOT_FOUND
    assert second.status_code == status.HTTP_404_NOT_FOUND
    assert "cache-control" not in first.headers
    assert "cache-control" not in second.headers
    assert len(response_cache._cache_key_to_cached_response) == 0


def test_speech_search_answers_200(api_client: TestClient) -> None:
    response = api_client.get("/search/speeches", params={"q": "housing"})

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["page"] == 1
    assert isinstance(body["results"], list)
    assert response.headers["cache-control"] == "public, max-age=3600"


def test_a_sitting_answers_200_with_public_cache_control(
    api_client: TestClient,
) -> None:
    with Session(engine) as session:
        sitting_date = session.exec(
            select(Report.sitting_date).order_by(Report.sitting_date.desc()).limit(1)
        ).one()

    response = api_client.get(f"/sittings/{sitting_date.date().isoformat()}")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"

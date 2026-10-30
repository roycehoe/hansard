import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session

from database.engine import engine
from schemas.coverage import GetCoverageResponse
from schemas.refresh import GetRefreshResponse

_PUBLIC_CACHE_CONTROL = "public, max-age=3600"


@pytest.mark.database
def test_coverage_answers_200_with_public_cache_control(
    api_client: TestClient,
) -> None:
    response = api_client.get("/coverage")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == _PUBLIC_CACHE_CONTROL
    body = response.json()
    assert GetCoverageResponse.model_validate(body).model_dump(mode="json") == body
    assert body["years"]


@pytest.mark.database
def test_refresh_answers_200_with_public_cache_control(
    api_client: TestClient,
) -> None:
    response = api_client.get("/refresh")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == _PUBLIC_CACHE_CONTROL
    body = response.json()
    assert GetRefreshResponse.model_validate(body).model_dump(mode="json") == body


@pytest.mark.database
def test_coverage_counts_the_assent_reports_with_no_text_by_design(
    api_client: TestClient,
) -> None:
    with Session(engine) as session:
        expected_count = session.exec(
            text(
                "select count(*) from report r"
                " where r.report_type = 'atbp'"
                " and r.sitting_date >= timestamp '2012-09-10'"
                " and not exists (select 1 from speech s where s.report_id = r.id)"
            )
        ).one()[0]

    body = api_client.get("/coverage").json()

    assert body["no_text_by_design_report_count"] == expected_count

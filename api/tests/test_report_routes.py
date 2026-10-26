import re
from urllib.parse import quote

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from database.engine import engine
from database.report import Report
from schemas.report import GetReportMatchedWordsResponse, GetReportResponse

pytestmark = pytest.mark.database

_MINIMUM_MATCHED_WORD_LENGTH = 4


@pytest.fixture
def report_slug(api_client: TestClient) -> str:
    with Session(engine) as session:
        sitting_date = session.exec(
            select(Report.sitting_date).order_by(Report.sitting_date.desc()).limit(1)
        ).one()
    sitting = api_client.get(f"/sittings/{sitting_date.date().isoformat()}").json()
    return next(
        report["report_slug"]
        for report in sitting["reports"]
        if report["is_text_available"]
    )


def test_a_report_answers_200_with_its_shape(
    api_client: TestClient, report_slug: str
) -> None:
    response = api_client.get(f"/reports/{quote(report_slug, safe='')}")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert GetReportResponse.model_validate(body).model_dump(mode="json") == body
    assert body["report_slug"] == report_slug
    assert body["speeches"]


def test_report_matched_words_answer_200_with_their_shape(
    api_client: TestClient, report_slug: str
) -> None:
    report_url = f"/reports/{quote(report_slug, safe='')}"
    title = api_client.get(report_url).json()["title"]
    matched_word = re.findall(rf"[A-Za-z]{{{_MINIMUM_MATCHED_WORD_LENGTH},}}", title)[0]

    response = api_client.get(f"{report_url}/matched-words", params={"q": matched_word})

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert (
        GetReportMatchedWordsResponse.model_validate(body).model_dump(mode="json")
        == body
    )

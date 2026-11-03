from urllib.parse import quote

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session, col, select

from database.engine import engine
from database.report import Report
from database.report_asker import ReportAsker
from database.speaker import Speaker
from enums import PersonReportFilter
from schemas.person import (
    GetAllPartiesResponse,
    GetAllPersonsResponse,
    GetPersonReportsResponse,
    GetPersonResponse,
)
from utils.report_slug import get_report_slug

pytestmark = pytest.mark.database

_FIRST_PAGE = 1
_ASKER_PERSON_ID = 399
_ASKER_QUESTIONS_ASKED_COUNT = 999


@pytest.fixture
def person_id(api_client: TestClient) -> int:
    with Session(engine) as session:
        sitting_date = session.exec(
            select(Report.sitting_date).order_by(Report.sitting_date.desc()).limit(1)
        ).one()
    sitting = api_client.get(f"/sittings/{sitting_date.date().isoformat()}").json()
    for sitting_report in sitting["reports"]:
        if not sitting_report["is_text_available"]:
            continue
        report_slug = quote(sitting_report["report_slug"], safe="")
        speeches = api_client.get(f"/reports/{report_slug}").json()["speeches"]
        for speech in speeches:
            if speech["person_id"] is not None:
                return speech["person_id"]
    raise AssertionError("The latest sitting has no speech linked to a person.")


def test_all_persons_answer_200_with_their_shape(api_client: TestClient) -> None:
    response = api_client.get("/people")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert GetAllPersonsResponse.model_validate(body).model_dump(mode="json") == body
    assert body["persons"]


def test_a_person_answers_200_with_their_shape(
    api_client: TestClient, person_id: int
) -> None:
    response = api_client.get(f"/people/{person_id}")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert GetPersonResponse.model_validate(body).model_dump(mode="json") == body
    assert body["person_id"] == person_id


def test_a_person_reports_answer_200_with_their_shape(
    api_client: TestClient, person_id: int
) -> None:
    response = api_client.get(f"/people/{person_id}/reports")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert GetPersonReportsResponse.model_validate(body).model_dump(mode="json") == body
    assert body["reports"]
    assert body["page"] == _FIRST_PAGE


def test_a_person_reports_filtered_to_questions_asked_list_only_asked_reports(
    api_client: TestClient,
) -> None:
    with Session(engine) as session:
        asked_report_slugs = {
            get_report_slug(report_id)
            for report_id in session.exec(
                select(Report.report_id)
                .join(ReportAsker, col(ReportAsker.report_id) == col(Report.id))
                .join(Speaker, col(Speaker.id) == col(ReportAsker.speaker_id))
                .where(Speaker.person_id == _ASKER_PERSON_ID)
            ).all()
        }

    response = api_client.get(
        f"/people/{_ASKER_PERSON_ID}/reports",
        params={"filter": PersonReportFilter.ASKED},
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert GetPersonReportsResponse.model_validate(body).model_dump(mode="json") == body
    assert body["questions_asked_count"] == _ASKER_QUESTIONS_ASKED_COUNT
    assert body["reports"]
    assert {report["report_slug"] for report in body["reports"]} <= asked_report_slugs


def test_all_parties_answer_200_with_their_shape(api_client: TestClient) -> None:
    response = api_client.get("/parties")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert GetAllPartiesResponse.model_validate(body).model_dump(mode="json") == body
    assert body["parties"]

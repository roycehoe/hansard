import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from database.engine import engine
from database.report import Report
from schemas.parliament import GetAllParliamentsResponse
from schemas.sitting import GetAllSittingsResponse, GetSittingResponse

pytestmark = pytest.mark.database


def test_all_parliaments_answer_200_with_their_shape(api_client: TestClient) -> None:
    response = api_client.get("/parliaments")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert (
        GetAllParliamentsResponse.model_validate(body).model_dump(mode="json") == body
    )
    assert body["parliaments"]


def test_all_sittings_of_a_parliament_answer_200_with_their_shape(
    api_client: TestClient,
) -> None:
    parliaments = api_client.get("/parliaments").json()["parliaments"]
    parliament_number = max(
        parliament["parliament_number"] for parliament in parliaments
    )

    response = api_client.get(
        "/sittings", params={"parliament_number": parliament_number}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert GetAllSittingsResponse.model_validate(body).model_dump(mode="json") == body
    assert body["sittings"]


def test_a_sitting_answers_200_with_its_shape(api_client: TestClient) -> None:
    with Session(engine) as session:
        sitting_date = session.exec(
            select(Report.sitting_date).order_by(Report.sitting_date.desc()).limit(1)
        ).one()

    response = api_client.get(f"/sittings/{sitting_date.date().isoformat()}")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert GetSittingResponse.model_validate(body).model_dump(mode="json") == body
    assert body["reports"]

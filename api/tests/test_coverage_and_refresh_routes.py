import pytest
from fastapi import status
from fastapi.testclient import TestClient

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

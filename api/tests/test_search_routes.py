import pytest
from fastapi import status
from fastapi.testclient import TestClient

from enums import SearchSort
from schemas.search import SearchReportsResponse, SearchSpeechesResponse

pytestmark = pytest.mark.database

_SEARCH_WORD = "housing"


@pytest.mark.parametrize("sort", list(SearchSort))
def test_speech_search_answers_200_with_its_shape(
    api_client: TestClient, sort: SearchSort
) -> None:
    response = api_client.get(
        "/search/speeches", params={"q": _SEARCH_WORD, "sort": sort.value}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert SearchSpeechesResponse.model_validate(body).model_dump(mode="json") == body
    assert body["results"]


@pytest.mark.parametrize("sort", list(SearchSort))
def test_report_search_answers_200_with_its_shape(
    api_client: TestClient, sort: SearchSort
) -> None:
    response = api_client.get(
        "/search/reports", params={"q": _SEARCH_WORD, "sort": sort.value}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"
    body = response.json()
    assert SearchReportsResponse.model_validate(body).model_dump(mode="json") == body
    assert body["results"]

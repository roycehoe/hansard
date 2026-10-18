import pytest
from fastapi import status
from fastapi.testclient import TestClient

from services import search as search_service

_SEARCH_PATHS = ("/search/speeches", "/search/reports")
_BROAD_FILTER_PARLIAMENT_NUMBER = 14


@pytest.mark.parametrize("search_path", _SEARCH_PATHS)
def test_a_page_past_the_last_answers_422(
    api_client: TestClient, search_path: str
) -> None:
    response = api_client.get(
        search_path,
        params={"q": "housing", "page": search_service.MAX_SEARCH_PAGE + 1},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "cache-control" not in response.headers


@pytest.mark.database
@pytest.mark.parametrize("search_path", _SEARCH_PATHS)
def test_the_last_page_has_no_next_page(
    api_client: TestClient, search_path: str
) -> None:
    params = {"parliament_number": _BROAD_FILTER_PARLIAMENT_NUMBER}

    before_last = api_client.get(
        search_path, params={**params, "page": search_service.MAX_SEARCH_PAGE - 1}
    )
    last = api_client.get(
        search_path, params={**params, "page": search_service.MAX_SEARCH_PAGE}
    )

    assert before_last.status_code == status.HTTP_200_OK
    assert before_last.json()["has_next_page"] is True
    assert last.status_code == status.HTTP_200_OK
    assert last.json()["is_total_capped"] is True
    assert last.json()["has_next_page"] is False

import pytest
from fastapi import status
from fastapi.testclient import TestClient

pytestmark = pytest.mark.database

_SEARCH_PATH = "/search/speeches"
_LEE_KUAN_YEW_PERSON_ID = 29
_FILTER_PARAMS = (
    {"person_id": _LEE_KUAN_YEW_PERSON_ID, "parliament_number": 5},
    {"constituency": "Potong Pasir", "parliament_number": 12},
)


def _get_total_count(api_client: TestClient, params: dict[str, object]) -> int:
    response = api_client.get(_SEARCH_PATH, params=params)
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert not body["is_total_capped"]
    return body["total_count"]


@pytest.mark.parametrize("filter_params", _FILTER_PARAMS)
def test_an_excluded_word_with_a_person_or_seat_leaves_out_its_paragraphs(
    api_client: TestClient, filter_params: dict[str, object]
) -> None:
    filter_count = _get_total_count(api_client, filter_params)
    with_word_count = _get_total_count(api_client, {"q": "housing", **filter_params})
    without_word_count = _get_total_count(
        api_client, {"q": "-housing", **filter_params}
    )

    assert with_word_count > 0
    assert without_word_count == filter_count - with_word_count


@pytest.mark.parametrize("filter_params", _FILTER_PARAMS)
def test_an_excluded_word_with_a_person_or_seat_lists_newest_first(
    api_client: TestClient, filter_params: dict[str, object]
) -> None:
    response = api_client.get(_SEARCH_PATH, params={"q": "-housing", **filter_params})

    assert response.status_code == status.HTTP_200_OK
    sitting_dates = [result["sitting_date"] for result in response.json()["results"]]
    assert sitting_dates != []
    assert sitting_dates == sorted(sitting_dates, reverse=True)

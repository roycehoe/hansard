import pytest
from fastapi import status
from fastapi.testclient import TestClient

_SEARCH_PATH = "/search/speeches"
_LEE_KUAN_YEW_PERSON_ID = 29


@pytest.mark.database
@pytest.mark.parametrize("constituency", ["Bishan Toa Payoh", "Ang  Mo Kio"])
def test_a_seat_typed_with_other_hyphens_or_spaces_still_matches(
    api_client: TestClient, constituency: str
) -> None:
    response = api_client.get(_SEARCH_PATH, params={"constituency": constituency})

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["total_count"] > 0


@pytest.mark.database
def test_a_name_matching_no_seat_answers_404(api_client: TestClient) -> None:
    response = api_client.get(_SEARCH_PATH, params={"constituency": "No Such Seat"})

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"]["error_code"] == "search.constituency_not_found"


@pytest.mark.database
def test_a_person_who_never_sat_for_a_real_seat_has_no_speeches(
    api_client: TestClient,
) -> None:
    response = api_client.get(
        _SEARCH_PATH,
        params={"person_id": _LEE_KUAN_YEW_PERSON_ID, "constituency": "Tampines"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["total_count"] == 0

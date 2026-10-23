import pytest
from fastapi import status
from fastapi.testclient import TestClient

from middleware import search_slot


@pytest.mark.parametrize(
    "url", ["/search/speeches?q=housing", "/search/reports?q=housing"]
)
def test_search_answers_429_while_every_slot_is_held(
    api_client: TestClient, url: str
) -> None:
    slots = search_slot._search_slots
    for _ in range(search_slot._MAX_RUNNING_SEARCHES):
        assert slots.acquire(blocking=False)
    try:
        response = api_client.get(url)
    finally:
        for _ in range(search_slot._MAX_RUNNING_SEARCHES):
            slots.release()

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert response.json() == {
        "detail": {
            "error_code": "search.busy",
            "message": "Search is busy. Try again in a moment.",
        }
    }
    assert "cache-control" not in response.headers

    for _ in range(search_slot._MAX_RUNNING_SEARCHES):
        assert slots.acquire(blocking=False)
    assert not slots.acquire(blocking=False)
    for _ in range(search_slot._MAX_RUNNING_SEARCHES):
        slots.release()

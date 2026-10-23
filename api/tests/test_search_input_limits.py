import pytest
from fastapi import status
from fastapi.testclient import TestClient

_SEARCH_PATHS = ("/search/speeches", "/search/reports")
_OVERFLOWING_INTEGER = 99999999999
_HUGE_INTEGER = 99999999999999999999
_NUL_BYTE = "\x00"


@pytest.mark.parametrize(
    ("path", "params"),
    [
        ("/search/speeches", {"person_id": _OVERFLOWING_INTEGER}),
        ("/search/speeches", {"parliament_number": _OVERFLOWING_INTEGER}),
        ("/search/reports", {"parliament_number": _OVERFLOWING_INTEGER}),
        ("/search/speeches", {"q": f"housing{_NUL_BYTE}"}),
        ("/search/reports", {"q": f"housing{_NUL_BYTE}"}),
        ("/search/speeches", {"constituency": f"a{_NUL_BYTE}"}),
        ("/search/speeches", {"q": "housing", "report": f"a{_NUL_BYTE}"}),
        ("/people", {"parliament_number": _OVERFLOWING_INTEGER}),
        ("/sittings", {"parliament_number": _OVERFLOWING_INTEGER}),
        (f"/people/{_OVERFLOWING_INTEGER}", {}),
        (f"/people/{_OVERFLOWING_INTEGER}/reports", {}),
        ("/people/1/reports", {"page": _HUGE_INTEGER}),
        ("/people", {"party": f"a{_NUL_BYTE}"}),
        ("/people", {"constituency": f"a{_NUL_BYTE}"}),
        ("/people", {"name": f"a{_NUL_BYTE}"}),
        ("/reports/a%00", {}),
        ("/reports/a%00/matched-words", {"q": "housing"}),
        ("/reports/a/matched-words", {"q": f"housing{_NUL_BYTE}"}),
    ],
)
def test_out_of_range_input_answers_422(
    api_client: TestClient, path: str, params: dict[str, object]
) -> None:
    response = api_client.get(path, params=params)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


@pytest.mark.parametrize("path", _SEARCH_PATHS)
def test_excluded_words_only_answers_422_with_its_error_code(
    api_client: TestClient, path: str
) -> None:
    response = api_client.get(path, params={"q": "-housing"})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json()["detail"]["error_code"] == "search.excluded_words_only"

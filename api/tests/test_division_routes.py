import pytest
from fastapi.testclient import TestClient

from exceptions.base import ERRORS, ErrorCode
from main import app
from settings import settings

_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"


@pytest.mark.parametrize(
    "path", ["/divisions", "/divisions/1", "/minutes", "/minutes?status=TEXT_STORED"]
)
def test_a_division_or_minutes_endpoint_answers_404_while_the_setting_is_off(
    path: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = TestClient(app).get(path)

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert response.json()["detail"]["error_code"] == ErrorCode.ENDPOINT_NOT_FOUND


@pytest.mark.parametrize("path", ["/divisions", "/divisions/1", "/minutes"])
def test_a_query_parameter_cannot_turn_a_division_or_minutes_endpoint_on(
    path: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = TestClient(app).get(path, params={_GATE_SETTING_NAME: "true"})

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code

import pytest
from fastapi.testclient import TestClient

from exceptions.base import ERRORS, ErrorCode
from main import app
from settings import settings

_REPORT_LINKS_PATH = "/reports/some-slug/links"
_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"


def test_the_report_links_endpoint_answers_404_while_the_setting_is_off(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = TestClient(app).get(_REPORT_LINKS_PATH)

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert response.json()["detail"]["error_code"] == ErrorCode.ENDPOINT_NOT_FOUND


def test_a_query_parameter_cannot_turn_the_report_links_endpoint_on(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = TestClient(app).get(
        _REPORT_LINKS_PATH, params={_GATE_SETTING_NAME: "true"}
    )

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code

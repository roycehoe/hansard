import pytest
from fastapi.testclient import TestClient

from exceptions.base import ERRORS, ErrorCode
from main import app
from settings import settings

_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"


@pytest.mark.parametrize(
    "path",
    [
        "/offices/ministries",
        "/offices/ministries/1",
        "/offices/ministries/1/questions?by=put_to",
        "/offices/memberships/1/printed-ranges",
        "/offices/reports/any-report-slug",
    ],
)
def test_an_office_endpoint_answers_404_while_the_setting_is_off(
    path: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = TestClient(app).get(path)

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert response.json()["detail"]["error_code"] == ErrorCode.ENDPOINT_NOT_FOUND

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from exceptions.base import ERRORS, ErrorCode
from settings import settings

_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"
_UNRELEASED_PATHS = (
    "/bills/some-report-slug",
    "/acts/FSA1965/people",
    "/people/1/bills",
)


@pytest.mark.parametrize("path", _UNRELEASED_PATHS)
def test_a_bill_or_act_route_answers_404_while_the_setting_is_off(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch, path: str
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = api_client.get(path)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert response.json()["detail"]["error_code"] == ErrorCode.ENDPOINT_NOT_FOUND

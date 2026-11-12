import pytest
from fastapi import APIRouter, Depends, FastAPI
from fastapi.testclient import TestClient

from exceptions.base import ERRORS, ErrorCode
from main import app
from settings import AppSettings, settings
from validators.unreleased_endpoint import validate_can_read_unreleased_endpoint

_UNRELEASED_PATH = "/unreleased"
_OK_STATUS_CODE = 200
_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"
_PERSON_LEAVE_SEAT_AND_OFFICE_PATHS = (
    "/people/1/leave-periods",
    "/people/1/printed-ranges",
    "/leave-periods/latest-sitting",
    "/seats?constituency=Aljunied",
)


def _get_unreleased_answer() -> dict[str, str]:
    return {}


@pytest.fixture
def unreleased_client() -> TestClient:
    router = APIRouter(dependencies=[Depends(validate_can_read_unreleased_endpoint)])
    router.add_api_route(_UNRELEASED_PATH, _get_unreleased_answer, methods=["GET"])
    unreleased_app = FastAPI()
    unreleased_app.include_router(router)
    return TestClient(unreleased_app)


def test_the_setting_is_off_by_default() -> None:
    assert AppSettings.model_fields[_GATE_SETTING_NAME].default is False


def test_an_unreleased_endpoint_answers_404_while_the_setting_is_off(
    unreleased_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = unreleased_client.get(_UNRELEASED_PATH)

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert response.json()["detail"]["error_code"] == ErrorCode.ENDPOINT_NOT_FOUND


def test_a_query_parameter_cannot_turn_the_setting_on(
    unreleased_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = unreleased_client.get(
        _UNRELEASED_PATH, params={_GATE_SETTING_NAME: "true"}
    )

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code


def test_an_unreleased_endpoint_answers_while_the_setting_is_on(
    unreleased_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, True)

    response = unreleased_client.get(_UNRELEASED_PATH)

    assert response.status_code == _OK_STATUS_CODE


@pytest.mark.parametrize("path", _PERSON_LEAVE_SEAT_AND_OFFICE_PATHS)
def test_a_leave_seat_or_person_office_endpoint_answers_404_while_the_setting_is_off(
    path: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = TestClient(app).get(path)

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert response.json()["detail"]["error_code"] == ErrorCode.ENDPOINT_NOT_FOUND

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session

from exceptions.base import ERRORS, ErrorCode
from schemas.bill import GetPersonBillsResponse
from services import bill as bill_service
from settings import settings

_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"
_UNRELEASED_PATHS = (
    "/bills/some-report-slug",
    "/acts/FSA1965/people",
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


def _get_no_person_bills(
    person_id: int, page: int, page_size: int, session: Session
) -> GetPersonBillsResponse:
    return GetPersonBillsResponse(
        bills=[], page=page, page_size=page_size, has_next_page=False, total_count=0
    )


def test_a_persons_bills_answer_while_the_setting_is_off(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)
    monkeypatch.setattr(bill_service, "get_person_bills", _get_no_person_bills)

    response = api_client.get("/people/1/bills")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["total_count"] == 0

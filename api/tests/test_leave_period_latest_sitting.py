from datetime import date
from typing import Optional

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from main import app
from services import leave_period as leave_period_service
from settings import settings

_LATEST_SITTING_PATH = "/leave-periods/latest-sitting"
_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"
_OK_STATUS_CODE = 200


class _FakeLeavePeriodPrinting:
    def __init__(self, session: Session):
        pass

    def get_max_sitting_date(self) -> Optional[date]:
        return None


def test_no_stored_printing_answers_200_with_a_null_date_and_no_leave_periods(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, True)
    monkeypatch.setattr(
        leave_period_service, "CRUDLeavePeriodPrinting", _FakeLeavePeriodPrinting
    )

    response = TestClient(app).get(_LATEST_SITTING_PATH)

    assert response.status_code == _OK_STATUS_CODE
    assert response.json() == {"sitting_date": None, "leave_periods": []}

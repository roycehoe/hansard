from typing import Any, Optional
from unittest.mock import MagicMock

import pytest

from services import preview as preview_service

_MISSING_REPORT_PATH = "/reports/no-such-report"


class _CountingCRUDReport:
    lookup_count = 0

    def __init__(self, session: Any) -> None:
        pass

    def get_by_report_id(self, report_id: str) -> Optional[Any]:
        _CountingCRUDReport.lookup_count += 1
        return None


@pytest.fixture(autouse=True)
def stub_report_lookup(monkeypatch: pytest.MonkeyPatch) -> None:
    _CountingCRUDReport.lookup_count = 0
    monkeypatch.setattr(preview_service, "CRUDReport", _CountingCRUDReport)
    monkeypatch.setattr(preview_service, "_cache_key_to_cached_preview", {})


def test_a_missing_report_is_looked_up_again_on_the_next_request() -> None:
    session = MagicMock()

    first = preview_service.get_preview(_MISSING_REPORT_PATH, None, None, session)
    lookups_after_first = _CountingCRUDReport.lookup_count
    second = preview_service.get_preview(_MISSING_REPORT_PATH, None, None, session)

    assert not first.is_found
    assert not second.is_found
    assert lookups_after_first > 0
    assert _CountingCRUDReport.lookup_count == 2 * lookups_after_first

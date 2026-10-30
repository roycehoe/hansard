from datetime import datetime

import pytest
from sqlmodel import Session

from database.report import Report
from services import sitemap as sitemap_service

_SITE_URL = "https://hansard.example.sg"


class _StubCRUDReport:
    def __init__(self, session: Session):
        pass

    def get_all_sitting_dates(self) -> list:
        return []

    def get_all_with_text_not_in_report_ids(
        self, excluded_report_ids: list[str]
    ) -> list[Report]:
        return [Report(report_id="with-text-report", sitting_date=datetime(2024, 1, 9))]


class _StubCRUDPerson:
    def __init__(self, session: Session):
        pass

    def get_all(self) -> list:
        return []


def test_the_reports_file_lists_only_the_reports_the_crud_returns_as_having_text(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(sitemap_service, "CRUDReport", _StubCRUDReport)
    monkeypatch.setattr(sitemap_service, "CRUDPerson", _StubCRUDPerson)

    file_name_to_xml = sitemap_service._get_uncached_file_name_to_xml(
        _SITE_URL,
        None,  # type: ignore[arg-type]
    )

    assert "with-text-report" in file_name_to_xml["sitemap-reports-1.xml"]
    assert "no-text-report" not in file_name_to_xml["sitemap-reports-1.xml"]

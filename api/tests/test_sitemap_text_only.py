from datetime import datetime

import pytest
from sqlmodel import Session

from database.act import Act
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


class _StubCRUDAct:
    def __init__(self, session: Session):
        pass

    def get_all(self) -> list[Act]:
        return [Act(id=1, sso_code="CAMC1999A2007", title="Carriage by Air Act")]


def test_the_reports_file_lists_only_the_reports_the_crud_returns_as_having_text(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(sitemap_service, "CRUDReport", _StubCRUDReport)
    monkeypatch.setattr(sitemap_service, "CRUDPerson", _StubCRUDPerson)
    monkeypatch.setattr(sitemap_service, "CRUDAct", _StubCRUDAct)

    file_name_to_xml = sitemap_service._get_uncached_file_name_to_xml(
        _SITE_URL,
        None,  # type: ignore[arg-type]
    )

    assert "with-text-report" in file_name_to_xml["sitemap-reports-1.xml"]
    assert "no-text-report" not in file_name_to_xml["sitemap-reports-1.xml"]


def test_the_acts_file_lists_each_act_by_its_sso_code_with_no_last_modified_date(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(sitemap_service, "CRUDReport", _StubCRUDReport)
    monkeypatch.setattr(sitemap_service, "CRUDPerson", _StubCRUDPerson)
    monkeypatch.setattr(sitemap_service, "CRUDAct", _StubCRUDAct)

    file_name_to_xml = sitemap_service._get_uncached_file_name_to_xml(
        _SITE_URL,
        None,  # type: ignore[arg-type]
    )

    assert (
        f"<url><loc>{_SITE_URL}/acts/CAMC1999A2007</loc></url>"
        in file_name_to_xml["sitemap-acts-1.xml"]
    )

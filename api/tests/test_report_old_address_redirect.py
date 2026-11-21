from datetime import datetime
from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlmodel import Session
from starlette.applications import Starlette
from starlette.routing import Mount

from database.report import Report
from middleware import frontend, takedown
from middleware.report_redirect import get_old_report_address_url
from services import preview as preview_service
from services import report as report_service

_NATIONAL_SERVICE_PREFIX = "00069159-ZZ.00052829-ZZ_1"
_NATIONAL_SERVICE_SLUG = f"{_NATIONAL_SERVICE_PREFIX}#id016_19670313_S0004_T00072-bill"
_NATIONAL_SERVICE_PATH = (
    f"/reports/{_NATIONAL_SERVICE_PREFIX}%23id016_19670313_S0004_T00072-bill"
)
_OTHER_SLUG = f"{_NATIONAL_SERVICE_PREFIX}#id017_19670313_S0004_T00073-bill"


def _get_report(slug: str) -> Report:
    return Report(  # type: ignore[call-arg]
        id=1, report_id=slug + "#", sitting_date=datetime(1967, 3, 13)
    )


class _FakeReport:
    reports_with_prefix: list[Report] = []
    reports_with_id: list[Report] = []

    def __init__(self, session: Session):
        self.session = session

    def get_all_by_report_id_prefix(
        self, report_id_prefix: str, limit: int
    ) -> list[Report]:
        return [
            report
            for report in self.reports_with_prefix
            if report.report_id.startswith(report_id_prefix)
        ][:limit]

    def get_all_by_report_ids(self, report_ids: list[str]) -> list[Report]:
        return [
            report for report in self.reports_with_id if report.report_id in report_ids
        ]


@pytest.fixture
def old_address_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    (tmp_path / "index.html").write_text("<html><head></head></html>")
    monkeypatch.setattr(
        frontend,
        "_get_page_preview",
        lambda path, ordinal, anchor: preview_service.get_not_found_preview(),
    )
    monkeypatch.setattr(report_service, "CRUDReport", _FakeReport)
    monkeypatch.setattr(takedown, "_TAKEN_DOWN_REPORT_SLUGS", frozenset())
    monkeypatch.setattr(
        _FakeReport, "reports_with_prefix", [_get_report(_NATIONAL_SERVICE_SLUG)]
    )
    monkeypatch.setattr(
        _FakeReport, "reports_with_id", [_get_report(_NATIONAL_SERVICE_SLUG)]
    )
    return TestClient(
        Starlette(
            routes=[Mount("/", frontend.FrontendFiles(tmp_path, None), name="frontend")]
        ),
        follow_redirects=False,
    )


def test_an_address_cut_short_where_the_percent_23_was_redirects_to_the_report(
    old_address_client: TestClient,
) -> None:
    response = old_address_client.get(f"/reports/{_NATIONAL_SERVICE_PREFIX}?ref=mail")

    assert response.status_code == status.HTTP_301_MOVED_PERMANENTLY
    assert response.headers["location"] == f"{_NATIONAL_SERVICE_PATH}?ref=mail"


def test_a_double_encoded_address_redirects_to_the_report(
    old_address_client: TestClient,
) -> None:
    assert (
        get_old_report_address_url(_NATIONAL_SERVICE_PATH, "ref=mail")
        == f"{_NATIONAL_SERVICE_PATH}?ref=mail"
    )


def test_a_prefix_that_two_reports_share_stays_not_found(
    old_address_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        _FakeReport,
        "reports_with_prefix",
        [_get_report(_NATIONAL_SERVICE_SLUG), _get_report(_OTHER_SLUG)],
    )

    response = old_address_client.get(f"/reports/{_NATIONAL_SERVICE_PREFIX}")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_a_taken_down_report_is_not_revealed_by_either_old_form(
    old_address_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        takedown, "_TAKEN_DOWN_REPORT_SLUGS", frozenset({_NATIONAL_SERVICE_SLUG})
    )

    cut_short = old_address_client.get(f"/reports/{_NATIONAL_SERVICE_PREFIX}")

    assert cut_short.status_code == status.HTTP_404_NOT_FOUND
    assert get_old_report_address_url(_NATIONAL_SERVICE_PATH, "") is None

from datetime import datetime
from typing import Optional

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from database.report import Report
from database.report_link import ReportLink
from enums import ReportLinkRelation, ReportLinkType, ReportType
from exceptions.base import ERRORS, ErrorCode
from main import app
from middleware import takedown
from services import report as report_service
from settings import settings

_REPORT_LINKS_PATH = "/reports/some-slug/links"
_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"
_VIEWED_SLUG = "viewed-1"
_OTHER_SLUG = "other-1"
_REPORT_ID_SUFFIX = "#"
_SITTING_DATE = datetime(1986, 3, 7)
_VIEWED_CITATION = "see the viewed report's citation"
_OTHER_CITATION = "see the other report's citation"


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


def _build_report(
    slug: str,
    report_type: ReportType = ReportType.ORAL_ANSWER,
    sitting_date: datetime = _SITTING_DATE,
) -> Report:
    return Report(
        id=1,
        volume_number=1,
        parliament_number=1,
        sitting_date=sitting_date,
        speech_number=1,
        title=f"title of {slug}",
        report_id=slug + _REPORT_ID_SUFFIX,
        report_type=report_type,
        report_version="1",
    )


def _build_report_link(
    source_slug: str,
    target_slug: str,
    link_type: ReportLinkType,
    printed_citation: str,
) -> ReportLink:
    return ReportLink(
        id=1,
        link_type=link_type,
        printed_citation=printed_citation,
        source_report_id=source_slug + _REPORT_ID_SUFFIX,
        target_report_id=target_slug + _REPORT_ID_SUFFIX,
    )


def _stub_reads(
    monkeypatch: pytest.MonkeyPatch,
    reports: list[Report],
    report_links: list[ReportLink],
) -> None:
    class _FakeReport:
        def __init__(self, session: Session):
            pass

        def get_by_report_id(self, report_id: str) -> Optional[Report]:
            for report in reports:
                if report.report_id == report_id:
                    return report
            return None

        def get_all_by_report_ids(self, report_ids: list[str]) -> list[Report]:
            return [report for report in reports if report.report_id in report_ids]

    class _FakeReportLink:
        def __init__(self, session: Session):
            pass

        def get_all_by_source_report_id(self, report_id: str) -> list[ReportLink]:
            return [
                report_link
                for report_link in report_links
                if report_link.source_report_id == report_id
            ]

        def get_all_by_target_report_id_and_link_type(
            self, report_id: str, link_type: ReportLinkType
        ) -> list[ReportLink]:
            return [
                report_link
                for report_link in report_links
                if report_link.target_report_id == report_id
                and report_link.link_type == link_type
            ]

    monkeypatch.setattr(report_service, "CRUDReport", _FakeReport)
    monkeypatch.setattr(report_service, "CRUDReportLink", _FakeReportLink)
    monkeypatch.setattr(takedown, "_TAKEN_DOWN_REPORT_SLUGS", [])


def _get_links(viewed_slug: str = _VIEWED_SLUG) -> list:
    return report_service.get_report_links(viewed_slug, Session()).links


@pytest.mark.parametrize(
    "correction_type", [ReportType.CLARIFICATION, ReportType.WRITTEN_STATEMENT]
)
def test_a_correction_report_corrects_the_report_it_prints_a_link_to(
    monkeypatch: pytest.MonkeyPatch, correction_type: ReportType
) -> None:
    correction = _build_report(_VIEWED_SLUG, correction_type)
    original = _build_report(_OTHER_SLUG)
    _stub_reads(
        monkeypatch,
        [correction, original],
        [
            _build_report_link(
                _VIEWED_SLUG, _OTHER_SLUG, ReportLinkType.CORRECTION, _VIEWED_CITATION
            )
        ],
    )

    links = _get_links()

    assert [link.relation for link in links] == [ReportLinkRelation.CORRECTS]
    assert links[0].report_slug == _OTHER_SLUG
    assert links[0].printed_citation == _VIEWED_CITATION


@pytest.mark.parametrize(
    "correction_type", [ReportType.CLARIFICATION, ReportType.WRITTEN_STATEMENT]
)
def test_the_corrected_report_sees_the_correction_that_links_to_it(
    monkeypatch: pytest.MonkeyPatch, correction_type: ReportType
) -> None:
    original = _build_report(_VIEWED_SLUG)
    correction = _build_report(_OTHER_SLUG, correction_type)
    _stub_reads(
        monkeypatch,
        [original, correction],
        [
            _build_report_link(
                _OTHER_SLUG, _VIEWED_SLUG, ReportLinkType.CORRECTION, _OTHER_CITATION
            )
        ],
    )

    links = _get_links()

    assert [link.relation for link in links] == [ReportLinkRelation.CORRECTED_BY]
    assert links[0].report_slug == _OTHER_SLUG
    assert links[0].printed_citation == _OTHER_CITATION


def test_an_original_that_prints_a_link_to_its_correction_sees_corrected_by(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    original = _build_report(_VIEWED_SLUG)
    correction = _build_report(_OTHER_SLUG, ReportType.CLARIFICATION)
    _stub_reads(
        monkeypatch,
        [original, correction],
        [
            _build_report_link(
                _VIEWED_SLUG, _OTHER_SLUG, ReportLinkType.CORRECTION, _VIEWED_CITATION
            )
        ],
    )

    assert [link.relation for link in _get_links()] == [ReportLinkRelation.CORRECTED_BY]
    assert [link.relation for link in _get_links(_OTHER_SLUG)] == [
        ReportLinkRelation.CORRECTS
    ]


@pytest.mark.parametrize("viewed_slug", [_VIEWED_SLUG, _OTHER_SLUG])
def test_a_correction_printed_both_ways_returns_once_with_the_viewed_reports_citation(
    monkeypatch: pytest.MonkeyPatch, viewed_slug: str
) -> None:
    correction = _build_report(_VIEWED_SLUG, ReportType.CLARIFICATION)
    original = _build_report(_OTHER_SLUG)
    _stub_reads(
        monkeypatch,
        [correction, original],
        [
            _build_report_link(
                _VIEWED_SLUG, _OTHER_SLUG, ReportLinkType.CORRECTION, _VIEWED_CITATION
            ),
            _build_report_link(
                _OTHER_SLUG, _VIEWED_SLUG, ReportLinkType.CORRECTION, _OTHER_CITATION
            ),
        ],
    )
    viewed_citation = {
        _VIEWED_SLUG: _VIEWED_CITATION,
        _OTHER_SLUG: _OTHER_CITATION,
    }[viewed_slug]

    links = _get_links(viewed_slug)

    assert len(links) == 1
    assert links[0].printed_citation == viewed_citation


@pytest.mark.parametrize(
    "link_type", [ReportLinkType.REPLY, ReportLinkType.CONTINUATION]
)
def test_a_reply_or_continuation_shows_only_on_the_report_that_prints_it(
    monkeypatch: pytest.MonkeyPatch, link_type: ReportLinkType
) -> None:
    printing_report = _build_report(_VIEWED_SLUG)
    linked_report = _build_report(_OTHER_SLUG)
    _stub_reads(
        monkeypatch,
        [printing_report, linked_report],
        [_build_report_link(_VIEWED_SLUG, _OTHER_SLUG, link_type, _VIEWED_CITATION)],
    )
    expected_relation = {
        ReportLinkType.REPLY: ReportLinkRelation.REFERS_TO,
        ReportLinkType.CONTINUATION: ReportLinkRelation.CONTINUES,
    }[link_type]

    assert [link.relation for link in _get_links()] == [expected_relation]
    assert _get_links(_OTHER_SLUG) == []


@pytest.mark.parametrize(
    "link_type",
    [ReportLinkType.CORRECTION, ReportLinkType.REPLY, ReportLinkType.CONTINUATION],
)
def test_a_link_to_a_taken_down_report_is_dropped(
    monkeypatch: pytest.MonkeyPatch, link_type: ReportLinkType
) -> None:
    _stub_reads(
        monkeypatch,
        [_build_report(_VIEWED_SLUG), _build_report(_OTHER_SLUG)],
        [_build_report_link(_VIEWED_SLUG, _OTHER_SLUG, link_type, _VIEWED_CITATION)],
    )
    monkeypatch.setattr(takedown, "_TAKEN_DOWN_REPORT_SLUGS", [_OTHER_SLUG])

    assert _get_links() == []


def test_a_correction_from_a_taken_down_report_is_dropped(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _stub_reads(
        monkeypatch,
        [
            _build_report(_VIEWED_SLUG),
            _build_report(_OTHER_SLUG, ReportType.CLARIFICATION),
        ],
        [
            _build_report_link(
                _OTHER_SLUG, _VIEWED_SLUG, ReportLinkType.CORRECTION, _OTHER_CITATION
            )
        ],
    )
    monkeypatch.setattr(takedown, "_TAKEN_DOWN_REPORT_SLUGS", [_OTHER_SLUG])

    assert _get_links() == []


def test_links_come_in_sitting_date_order_then_slug_order(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    reports = [
        _build_report(_VIEWED_SLUG),
        _build_report("c-late", sitting_date=datetime(1990, 1, 1)),
        _build_report("b-early", sitting_date=datetime(1980, 1, 1)),
        _build_report("b-same-day"),
        _build_report("a-same-day"),
    ]
    _stub_reads(
        monkeypatch,
        reports,
        [
            _build_report_link(
                _VIEWED_SLUG, report.report_id.rstrip("#"), ReportLinkType.REPLY, "x"
            )
            for report in reports[1:]
        ],
    )

    assert [link.report_slug for link in _get_links()] == [
        "b-early",
        "a-same-day",
        "b-same-day",
        "c-late",
    ]


def test_a_report_with_no_links_gives_an_empty_list(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _stub_reads(monkeypatch, [_build_report(_VIEWED_SLUG)], [])

    assert _get_links() == []

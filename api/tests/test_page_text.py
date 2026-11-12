import json
import re
from datetime import date
from pathlib import Path
from typing import Optional

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from sqlmodel import Session
from starlette.applications import Starlette
from starlette.routing import Mount

from enums import PreviewType, ReportType, SearchSort
from exceptions.person import PersonNotFoundException
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from exceptions.search import (
    SearchBusyException,
    SearchConstituencyNotFoundException,
    SearchTimedOutException,
)
from exceptions.sitting import SittingNotFoundException
from middleware import frontend
from schemas.parliament import GetAllParliamentsResponse, ParliamentData
from schemas.person import (
    GetPersonReportsResponse,
    GetPersonResponse,
    PersonMembershipData,
    PersonReportData,
)
from schemas.preview import PreviewData
from schemas.report import GetReportResponse, SpeechData
from schemas.search import (
    ReportMatchData,
    SearchReportsResponse,
    SearchSpeechesResponse,
    SpeechMatchData,
)
from schemas.sitting import (
    GetAllSittingsResponse,
    GetSittingResponse,
    SittingData,
    SittingReportData,
)
from services import parliament as parliament_service
from services import person as person_service
from services import preview as preview_service
from services import report as report_service
from services import search as search_service
from services import sitting as sitting_service
from settings import settings

_REPO_ROOT = Path(__file__).resolve().parents[2]
_ROOT_CONTENTS = re.compile(r'<div id="root">(.*)</div>', re.DOTALL)
_STRUCTURED_DATA = re.compile(r'<script type="application/ld\+json">(.*?)</script>')
_EMPTY_ROOT = '<div id="root"></div>'


def _get_report_preview() -> PreviewData:
    return PreviewData(
        title="Bill, 1 January 2020",
        description="A report.",
        preview_type=PreviewType.ARTICLE,
        path="/reports/bill-818",
        is_found=True,
        report_title="Bill",
        person_name="",
        sitting_date=date(2020, 1, 1),
    )


def _get_speech(ordinal: int, speaker_label: str, transcript: str) -> SpeechData:
    return SpeechData(
        ordinal=ordinal,
        speaker_label=speaker_label,
        transcript=transcript,
        kind=None,
        person_id=None,
        person_slug="",
        person_name="",
        is_shared_role_credit=False,
        anchor="",
        column_start=None,
        column_note=None,
        column_suggested=None,
    )


def _get_report(title: str, speeches: list[SpeechData]) -> GetReportResponse:
    return GetReportResponse(
        report_slug="bill-818",
        title=title,
        subtitle="Second Reading",
        report_type="bill",
        parliament_number=14,
        volume_number=95,
        sitting_number=1,
        sitting_date=date(2020, 1, 1),
        official_record_url="https://sprs.parl.gov.sg/",
        is_text_available=True,
        speeches=speeches,
        askers=[],
        speech_link=None,
        referenced_written_answer=None,
        referencing_oral_answer=None,
        previous_report=None,
        next_report=None,
    )


def _get_site_client(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    preview: PreviewData,
    site_url: Optional[str],
) -> TestClient:
    (tmp_path / "index.html").write_text(
        "<html><head><!--preview-tags--><title>Open Hansard</title>"
        f"<!--/preview-tags--></head><body>{_EMPTY_ROOT}</body></html>"
    )
    monkeypatch.setattr(
        frontend, "_get_page_preview", lambda path, ordinal, anchor: preview
    )
    return TestClient(
        Starlette(
            routes=[
                Mount("/", frontend.FrontendFiles(tmp_path, site_url), name="frontend")
            ]
        )
    )


def _get_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, preview: PreviewData
) -> TestClient:
    return _get_site_client(tmp_path, monkeypatch, preview, None)


def _get_root_contents(page_html: str) -> str:
    match = _ROOT_CONTENTS.search(page_html)
    assert match is not None
    return match.group(1)


def _fail_if_report_is_read(
    report_slug: str,
    speech_ordinal: object,
    speech_anchor: object,
    session: Session,
) -> GetReportResponse:
    raise AssertionError("the report should not be read")


def _fail_if_sitting_is_read(
    sitting_date: date, session: Session
) -> GetSittingResponse:
    raise AssertionError("the sitting should not be read")


def _fail_if_person_is_read(person_id: int, session: Session) -> GetPersonResponse:
    raise AssertionError("the person should not be read")


@pytest.mark.parametrize("query", ["", "?s=2&q=and+so"])
def test_a_report_page_carries_its_title_date_speakers_and_paragraphs(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str
) -> None:
    report = _get_report(
        "SUPPLY BILL",
        [
            _get_speech(1, "Mr Speaker", "Order. Second Reading."),
            _get_speech(2, "Mr Tan", "Sir, I beg to move."),
            _get_speech(3, "Mr Tan", "And so  the *Bill* stands."),
            _get_speech(5, "", "(Applause)"),
        ],
    )
    monkeypatch.setattr(
        report_service, "get_report", lambda slug, ordinal, anchor, session: report
    )
    client = _get_client(tmp_path, monkeypatch, _get_report_preview())

    response = client.get(f"/reports/bill-818{query}")

    assert response.status_code == status.HTTP_200_OK
    assert _get_root_contents(response.text).split("\n") == [
        "<main>",
        "<h1>SUPPLY BILL</h1>",
        "<p>Second Reading</p>",
        '<p><time datetime="2020-01-01">1 January 2020</time></p>',
        '<p>Source: <a href="https://sprs.parl.gov.sg/">'
        "Parliament of Singapore, Official Report, 1 January 2020</a>. "
        "Not an official Parliament site.</p>",
        '<p id="s1"><strong>Mr Speaker</strong>: Order. Second Reading.</p>',
        '<p id="s2"><strong>Mr Tan</strong>: Sir, I beg to move.</p>',
        '<p id="s3">And so  the *Bill* stands.</p>',
        '<p id="s5">(Applause)</p>',
        "</main>",
    ]


def test_report_text_is_escaped(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    report = _get_report(
        "<script>alert(1)</script>",
        [_get_speech(1, 'Mr "A" & B', "1 < 2 & </div><style>p{}</style>")],
    )
    monkeypatch.setattr(
        report_service, "get_report", lambda slug, ordinal, anchor, session: report
    )
    client = _get_client(tmp_path, monkeypatch, _get_report_preview())

    root_contents = _get_root_contents(client.get("/reports/bill-818").text)

    assert "<script" not in root_contents
    assert "<style" not in root_contents
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in root_contents
    assert (
        "<strong>Mr &quot;A&quot; &amp; B</strong>: "
        "1 &lt; 2 &amp; &lt;/div&gt;&lt;style&gt;p{}&lt;/style&gt;"
    ) in root_contents


@pytest.mark.parametrize(
    "error",
    [
        ReportTakenDownException,
        ReportNotFoundException,
        OperationalError("SELECT 1", {}, Exception("connection refused")),
    ],
)
def test_a_report_that_cannot_be_shown_leaves_the_root_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, error: Exception
) -> None:
    def raise_error(
        report_slug: str,
        speech_ordinal: object,
        speech_anchor: object,
        session: Session,
    ) -> GetReportResponse:
        raise error

    monkeypatch.setattr(report_service, "get_report", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_report_preview())

    response = client.get("/reports/bill-818")

    assert response.status_code == status.HTTP_200_OK
    assert _EMPTY_ROOT in response.text


@pytest.mark.parametrize(
    ("path", "preview"),
    [
        ("/reports/bill-1", preview_service.get_not_found_preview()),
        ("/reports/bill-1", preview_service.get_default_preview()),
        ("/people/1-tan", preview_service.get_not_found_preview()),
        ("/sittings/2020-01-01", preview_service.get_not_found_preview()),
        ("/search", preview_service.get_default_preview()),
        ("/coverage", preview_service.get_default_preview()),
    ],
)
def test_a_page_that_is_not_a_found_report_or_home_gets_no_text(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, path: str, preview: PreviewData
) -> None:
    monkeypatch.setattr(report_service, "get_report", _fail_if_report_is_read)
    monkeypatch.setattr(sitting_service, "get_sitting", _fail_if_sitting_is_read)
    monkeypatch.setattr(person_service, "get_person", _fail_if_person_is_read)
    client = _get_client(tmp_path, monkeypatch, preview)

    response = client.get(path)

    assert _EMPTY_ROOT in response.text


def _get_parliament(parliament_number: int) -> ParliamentData:
    return ParliamentData(
        parliament_number=parliament_number,
        sitting_count=1,
        report_count=1,
        text_report_count=1,
        first_sitting_date=date(2020, 1, 1),
        last_sitting_date=date(2020, 1, 1),
    )


def _get_sitting(sitting_date: date) -> SittingData:
    return SittingData(
        sitting_date=sitting_date,
        parliament_number=15,
        volume_number=96,
        sitting_number=1,
        session_number=1,
        report_count=1,
    )


@pytest.mark.parametrize(
    ("site_url", "search_example_url"),
    [
        (
            "https://hansard.example.sg/",
            "https://hansard.example.sg/search?q=your+words",
        ),
        (None, "/search?q=your+words"),
    ],
)
def test_the_home_page_links_parliaments_people_and_recent_sittings(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    site_url: Optional[str],
    search_example_url: str,
) -> None:
    monkeypatch.setattr(settings, "site_url", site_url)

    def get_all_sittings(
        parliament_number: int, session: Session
    ) -> GetAllSittingsResponse:
        assert parliament_number == 15
        return GetAllSittingsResponse(
            sittings=[_get_sitting(date(2026, 10, day)) for day in range(1, 8)]
        )

    monkeypatch.setattr(
        parliament_service,
        "get_all_parliaments",
        lambda session: GetAllParliamentsResponse(
            parliaments=[_get_parliament(0), _get_parliament(15)]
        ),
    )
    monkeypatch.setattr(sitting_service, "get_all_sittings", get_all_sittings)
    home_preview = PreviewData(
        title="Open Hansard",
        description="Singapore's Hansard & more.",
        preview_type=PreviewType.WEBSITE,
        path="/",
        is_found=True,
        report_title="",
        person_name="",
        sitting_date=None,
    )
    client = _get_client(tmp_path, monkeypatch, home_preview)

    root_contents = _get_root_contents(client.get("/").text)

    assert root_contents.split("\n") == [
        "<main>",
        "<h1>Open Hansard</h1>",
        "<p>Singapore&#x27;s Hansard &amp; more.</p>",
        f"<p>Search: {search_example_url}</p>",
        '<form method="get" action="/search"><label>Search words '
        '<input type="search" name="q"></label> <button type="submit">Search</button>'
        "</form>",
        '<p><a href="/people">Members of Parliament</a></p>',
        "<h2>Parliaments</h2>",
        "<ul>",
        '<li><a href="/sittings?parliament=0">Legislative Assembly</a></li>',
        '<li><a href="/sittings?parliament=15">Parliament 15</a></li>',
        "</ul>",
        "<h2>Recent sittings</h2>",
        "<ul>",
        '<li><a href="/sittings/2026-10-07">7 October 2026</a></li>',
        '<li><a href="/sittings/2026-10-06">6 October 2026</a></li>',
        '<li><a href="/sittings/2026-10-05">5 October 2026</a></li>',
        '<li><a href="/sittings/2026-10-04">4 October 2026</a></li>',
        '<li><a href="/sittings/2026-10-03">3 October 2026</a></li>',
        "</ul>",
        "</main>",
    ]


def test_a_database_failure_leaves_the_home_root_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(session: Session) -> GetAllParliamentsResponse:
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))

    monkeypatch.setattr(parliament_service, "get_all_parliaments", raise_error)
    client = _get_client(tmp_path, monkeypatch, preview_service.get_default_preview())

    response = client.get("/")

    assert response.status_code == status.HTTP_200_OK
    assert _EMPTY_ROOT in response.text


def test_the_app_page_has_the_empty_root_the_server_fills() -> None:
    index_html = (_REPO_ROOT / "app" / "index.html").read_text()

    assert index_html.count(_EMPTY_ROOT) == 1


def _get_sitting_preview() -> PreviewData:
    return PreviewData(
        title="Sitting of 7 October 2026",
        description="2 reports.",
        preview_type=PreviewType.WEBSITE,
        path="/sittings/2026-10-07",
        is_found=True,
        report_title="",
        person_name="",
        sitting_date=None,
    )


def _get_sitting_report(
    report_slug: str, title: str, subtitle: str
) -> SittingReportData:
    return SittingReportData(
        report_slug=report_slug,
        title=title,
        subtitle=subtitle,
        report_type="bill",
        speech_number=1,
        is_text_available=True,
    )


def test_a_sitting_page_links_each_report_of_the_sitting(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def get_sitting(sitting_date: date, session: Session) -> GetSittingResponse:
        assert sitting_date == date(2026, 10, 7)
        return GetSittingResponse(
            sitting_date=sitting_date,
            parliament_number=15,
            volume_number=96,
            sitting_number=39,
            session_number=1,
            reports=[
                _get_sitting_report("bill-1", "SUPPLY <BILL>", "Second Reading"),
                _get_sitting_report("00069110-ZZ_1#id004-budget", "BUDGET", ""),
            ],
            is_attendance_available=False,
            attendance=[],
        )

    monkeypatch.setattr(sitting_service, "get_sitting", get_sitting)
    client = _get_client(tmp_path, monkeypatch, _get_sitting_preview())

    root_contents = _get_root_contents(client.get("/sittings/2026-10-07").text)

    assert root_contents.split("\n") == [
        "<main>",
        '<h1>Sitting of <time datetime="2026-10-07">7 October 2026</time></h1>',
        "<ul>",
        '<li><a href="/reports/bill-1">SUPPLY &lt;BILL&gt;</a><br>Second Reading</li>',
        '<li><a href="/reports/00069110-ZZ_1%23id004-budget">BUDGET</a></li>',
        "</ul>",
        "</main>",
    ]


@pytest.mark.parametrize(
    "error",
    [
        SittingNotFoundException,
        OperationalError("SELECT 1", {}, Exception("connection refused")),
    ],
)
def test_a_sitting_that_cannot_be_shown_leaves_the_root_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, error: Exception
) -> None:
    def raise_error(sitting_date: date, session: Session) -> GetSittingResponse:
        raise error

    monkeypatch.setattr(sitting_service, "get_sitting", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_sitting_preview())

    response = client.get("/sittings/2026-10-07")

    assert response.status_code == status.HTTP_200_OK
    assert _EMPTY_ROOT in response.text


def _get_sittings_preview() -> PreviewData:
    return PreviewData(
        title="Sittings",
        description="An archive.",
        preview_type=PreviewType.WEBSITE,
        path="/sittings",
        is_found=True,
        report_title="",
        person_name="",
        sitting_date=None,
    )


def test_the_sittings_page_of_a_parliament_links_each_sitting(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def get_all_sittings(
        parliament_number: int, session: Session
    ) -> GetAllSittingsResponse:
        assert parliament_number == 0
        return GetAllSittingsResponse(
            sittings=[_get_sitting(date(1955, 4, 22)), _get_sitting(date(1955, 4, 23))]
        )

    monkeypatch.setattr(sitting_service, "get_all_sittings", get_all_sittings)
    client = _get_client(tmp_path, monkeypatch, _get_sittings_preview())

    root_contents = _get_root_contents(client.get("/sittings?parliament=0").text)

    assert root_contents.split("\n") == [
        "<main>",
        "<h1>Sittings</h1>",
        "<h2>Legislative Assembly</h2>",
        "<ul>",
        '<li><a href="/sittings/1955-04-22">22 April 1955</a></li>',
        '<li><a href="/sittings/1955-04-23">23 April 1955</a></li>',
        "</ul>",
        "</main>",
    ]


@pytest.mark.parametrize("query", ["", "?parliament=fifteen", "?parliament=99"])
def test_a_sittings_page_with_no_parliament_or_no_sittings_gets_no_text(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str
) -> None:
    monkeypatch.setattr(
        sitting_service,
        "get_all_sittings",
        lambda parliament_number, session: GetAllSittingsResponse(sittings=[]),
    )
    client = _get_client(tmp_path, monkeypatch, _get_sittings_preview())

    response = client.get(f"/sittings{query}")

    assert _EMPTY_ROOT in response.text


def test_a_database_failure_leaves_the_sittings_root_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(parliament_number: int, session: Session) -> GetAllSittingsResponse:
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))

    monkeypatch.setattr(sitting_service, "get_all_sittings", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_sittings_preview())

    response = client.get("/sittings?parliament=15")

    assert response.status_code == status.HTTP_200_OK
    assert _EMPTY_ROOT in response.text


def _get_person_preview() -> PreviewData:
    return PreviewData(
        title="Tan & Lee, speeches in Parliament",
        description="Every speech by Tan & Lee.",
        preview_type=PreviewType.WEBSITE,
        path="/people/7-tan-lee",
        is_found=True,
        report_title="",
        person_name="Tan <b>& Lee",
        sitting_date=None,
    )


def _get_person_membership(
    parliament_number: int, party: str, is_member: bool, constituencies: list[str]
) -> PersonMembershipData:
    return PersonMembershipData(
        parliament_number=parliament_number,
        party=party,
        party_affiliations=[],
        is_legislative_assembly=parliament_number == 0,
        is_member=is_member,
        constituencies=constituencies,
    )


def _get_person(memberships: list[PersonMembershipData]) -> GetPersonResponse:
    return GetPersonResponse(
        person_id=7,
        person_slug="tan-lee",
        canonical_name="Tan <b>& Lee",
        name_variants=[],
        name_spellings=[],
        memberships=memberships,
        parliament_counts=[],
    )


def _get_person_report(
    report_slug: str, title: str, sitting_date: date
) -> PersonReportData:
    return PersonReportData(
        report_slug=report_slug,
        title=title,
        subtitle="",
        report_type="bill",
        sitting_date=sitting_date,
        parliament_number=14,
        speech_count=3,
    )


def _get_person_reports_response(
    reports: list[PersonReportData], has_next_page: bool
) -> GetPersonReportsResponse:
    return GetPersonReportsResponse(
        reports=reports,
        page=1,
        page_size=20,
        has_next_page=has_next_page,
        total_count=1_234,
        questions_asked_count=0,
    )


@pytest.mark.parametrize(
    ("has_next_page", "shown_count_lines"),
    [(True, ["<p>Showing 2 of 1,234.</p>"]), (False, [])],
)
def test_a_person_page_lists_memberships_and_recent_reports(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    has_next_page: bool,
    shown_count_lines: list[str],
) -> None:
    person_report_arguments: list[tuple[object, ...]] = []

    def get_person_reports(*arguments: object) -> GetPersonReportsResponse:
        person_report_arguments.append(arguments[:-1])
        return _get_person_reports_response(
            [
                _get_person_report("bill-818", "SUPPLY BILL", date(2020, 1, 1)),
                _get_person_report(
                    "00069110-ZZ_1#id004-budget", "BUDGET <i>", date(2019, 3, 1)
                ),
            ],
            has_next_page,
        )

    monkeypatch.setattr(
        person_service,
        "get_person",
        lambda person_id, session: _get_person(
            [
                _get_person_membership(0, "Labour Front", True, ["Cairnhill"]),
                _get_person_membership(
                    14, "People's Action Party", True, ["Tampines", "Tampines East"]
                ),
                _get_person_membership(15, "", False, []),
            ]
        ),
    )
    monkeypatch.setattr(person_service, "get_person_reports", get_person_reports)
    client = _get_client(tmp_path, monkeypatch, _get_person_preview())

    response = client.get("/people/7-tan")

    assert person_report_arguments == [(7, 1, 20, None)]
    assert response.status_code == status.HTTP_200_OK
    assert _get_root_contents(response.text).split("\n") == [
        "<main>",
        "<h1>Tan &lt;b&gt;&amp; Lee</h1>",
        "<h2>Memberships</h2>",
        "<table>",
        "<tr><th>Parliament</th><th>Party</th><th>Constituencies</th></tr>",
        "<tr><td>Legislative Assembly</td><td>Labour Front</td><td>Cairnhill</td></tr>",
        "<tr><td>Parliament 14</td><td>People&#x27;s Action Party</td>"
        "<td>Tampines, Tampines East</td></tr>",
        "<tr><td>Parliament 15 (not a member)</td><td></td><td></td></tr>",
        "</table>",
        "<h2>Reports</h2>",
        '<p><a href="/search?person=7">Search this person&#x27;s speeches</a></p>',
        "<ol>",
        '<li><a href="/reports/bill-818">SUPPLY BILL</a>, '
        '<time datetime="2020-01-01">1 January 2020</time></li>',
        '<li><a href="/reports/00069110-ZZ_1%23id004-budget">BUDGET &lt;i&gt;</a>, '
        '<time datetime="2019-03-01">1 March 2019</time></li>',
        "</ol>",
        *shown_count_lines,
        "</main>",
    ]


def test_a_person_with_no_reports_says_so(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        person_service,
        "get_person",
        lambda person_id, session: _get_person(
            [_get_person_membership(14, "Workers' Party", True, ["Aljunied"])]
        ),
    )
    monkeypatch.setattr(
        person_service,
        "get_person_reports",
        lambda *arguments: _get_person_reports_response([], False),
    )
    client = _get_client(tmp_path, monkeypatch, _get_person_preview())

    root_lines = _get_root_contents(client.get("/people/7-tan").text).split("\n")

    assert root_lines[-3:] == [
        '<p><a href="/search?person=7">Search this person&#x27;s speeches</a></p>',
        "<p>No paragraphs by this person are in the archive yet.</p>",
        "</main>",
    ]


@pytest.mark.parametrize(
    "error",
    [
        PersonNotFoundException,
        OperationalError("SELECT 1", {}, Exception("connection refused")),
    ],
)
def test_a_person_who_cannot_be_shown_leaves_the_root_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, error: Exception
) -> None:
    def raise_error(person_id: int, session: Session) -> GetPersonResponse:
        raise error

    monkeypatch.setattr(person_service, "get_person", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_person_preview())

    response = client.get("/people/7-tan")

    assert response.status_code == status.HTTP_200_OK
    assert _EMPTY_ROOT in response.text


def test_a_person_page_head_carries_the_name_and_canonical_url_as_a_person(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_not_found(person_id: int, session: Session) -> GetPersonResponse:
        raise PersonNotFoundException

    monkeypatch.setattr(person_service, "get_person", raise_not_found)
    client = _get_site_client(
        tmp_path, monkeypatch, _get_person_preview(), "https://hansard.example.sg/"
    )

    structured_data_match = _STRUCTURED_DATA.search(client.get("/people/7-tan").text)

    assert structured_data_match is not None
    assert "<" not in structured_data_match.group(1)
    assert json.loads(structured_data_match.group(1)) == {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Tan <b>& Lee",
        "url": "https://hansard.example.sg/people/7-tan-lee",
    }


_COVERAGE_LINE = (
    "<p>This is an unofficial, English-only archive of Singapore&#x27;s "
    "parliamentary debates since 1955.</p>"
)


def _get_search_preview() -> PreviewData:
    return PreviewData(
        title="Search",
        description="An archive.",
        preview_type=PreviewType.WEBSITE,
        path="/search",
        is_found=True,
        report_title="",
        person_name="",
        sitting_date=None,
    )


def _get_speech_match(
    report_slug: str, title: str, ordinal: int, speaker_label: str, snippet: str
) -> SpeechMatchData:
    return SpeechMatchData(
        report_slug=report_slug,
        title=title,
        report_type="bill",
        sitting_date=date(2020, 1, 1),
        parliament_number=14,
        ordinal=ordinal,
        speaker_label=speaker_label,
        kind=None,
        person_id=None,
        person_slug="",
        person_name="",
        snippet=snippet,
        anchor="",
        report_match_count=1,
    )


def _get_search_speeches_response(
    results: list[SpeechMatchData], has_next_page: bool
) -> SearchSpeechesResponse:
    return SearchSpeechesResponse(
        results=results,
        page=1,
        page_size=20,
        has_next_page=has_next_page,
        total_count=1_000,
        is_total_capped=True,
    )


def _fail_if_search_runs(*arguments: object) -> SearchSpeechesResponse:
    raise AssertionError("the search should not run")


def test_a_search_page_lists_the_first_page_of_speech_matches(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    search_arguments: list[tuple[object, ...]] = []

    def search_speeches(*arguments: object) -> SearchSpeechesResponse:
        search_arguments.append(arguments[:-1])
        return _get_search_speeches_response(
            [
                _get_speech_match(
                    "bill-818",
                    "SUPPLY BILL",
                    3,
                    "Mr Tan",
                    "the <mark>default</mark> rate",
                ),
                _get_speech_match("bill-819", "LOANS BILL", 1, "", "no marks here"),
            ],
            True,
        )

    monkeypatch.setattr(search_service, "search_speeches", search_speeches)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    response = client.get("/search?q=+default+interest+&type=bill&page=2&tab=speeches")

    assert search_arguments == [
        (
            "default interest",
            None,
            None,
            None,
            ReportType.BILL,
            None,
            None,
            None,
            SearchSort.DATE,
            2,
            20,
        )
    ]
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["vary"] == "Sec-Fetch-Dest"
    assert _get_root_contents(response.text).split("\n") == [
        "<main>",
        "<h1>Search</h1>",
        _COVERAGE_LINE,
        "<p>more than 1,000 speech matches</p>",
        '<p><a href="/search?q=+default+interest+&amp;type=bill&amp;tab=titles">'
        "Title matches</a></p>",
        "<ol>",
        '<li><a href="/reports/bill-818?hl=default+interest#s3">SUPPLY BILL</a>, '
        '<time datetime="2020-01-01">1 January 2020</time><br>'
        "<strong>Mr Tan</strong>: the <mark>default</mark> rate</li>",
        '<li><a href="/reports/bill-819?hl=default+interest#s1">LOANS BILL</a>, '
        '<time datetime="2020-01-01">1 January 2020</time><br>no marks here</li>',
        "</ol>",
        '<p><a href="/search?q=+default+interest+&amp;type=bill&amp;page=3">'
        "Next page</a></p>",
        "</main>",
    ]


def test_search_text_is_escaped(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        search_service,
        "search_speeches",
        lambda *arguments: _get_search_speeches_response(
            [
                _get_speech_match(
                    "00069110-ZZ_1#id004-budget",
                    "<script>alert(1)</script>",
                    2,
                    'Mr "A" & B',
                    "1 < 2 <mark>tax</mark> </li><script>alert(2)</script>",
                )
            ],
            False,
        ),
    )
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_contents = _get_root_contents(
        client.get("/search", params={"q": 'tax "x" <b>'}).text
    )

    assert "<script" not in root_contents
    assert "<b>" not in root_contents
    assert (
        '<a href="/reports/00069110-ZZ_1%23id004-budget?hl=tax+%22x%22+%3Cb%3E#s2">'
        "&lt;script&gt;alert(1)&lt;/script&gt;</a>"
    ) in root_contents
    assert (
        "<strong>Mr &quot;A&quot; &amp; B</strong>: 1 &lt; 2 <mark>tax</mark> "
        "&lt;/li&gt;&lt;script&gt;alert(2)&lt;/script&gt;</li>"
    ) in root_contents


@pytest.mark.parametrize(
    ("query", "report_link"),
    [
        ("?q=%22carbon+tax%22", "/reports/bill-818?hl=%22%5C%22carbon+tax%5C%22%22#s3"),
        ("?q=2024", "/reports/bill-818?hl=%222024%22#s3"),
        ("?person=7", "/reports/bill-818#s3"),
    ],
)
def test_a_search_match_links_its_paragraph_as_the_app_does(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str, report_link: str
) -> None:
    monkeypatch.setattr(
        search_service,
        "search_speeches",
        lambda *arguments: _get_search_speeches_response(
            [_get_speech_match("bill-818", "SUPPLY BILL", 3, "", "text")], False
        ),
    )
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_contents = _get_root_contents(client.get(f"/search{query}").text)

    assert f'<a href="{report_link}">SUPPLY BILL</a>' in root_contents


@pytest.mark.parametrize(
    "headers",
    [{"Sec-Fetch-Dest": "document"}, {"sec-fetch-dest": "document"}],
)
def test_a_browser_page_load_runs_no_search_and_gets_the_same_page_otherwise(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, headers: dict[str, str]
) -> None:
    monkeypatch.setattr(
        search_service,
        "search_speeches",
        lambda *arguments: _get_search_speeches_response(
            [_get_speech_match("bill-818", "SUPPLY BILL", 3, "", "text")], False
        ),
    )
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())
    fetcher_response = client.get("/search?q=default")
    monkeypatch.setattr(search_service, "search_speeches", _fail_if_search_runs)

    browser_response = client.get("/search?q=default", headers=headers)

    assert _get_root_contents(fetcher_response.text) != ""
    assert _EMPTY_ROOT in browser_response.text
    assert _ROOT_CONTENTS.sub("", browser_response.text) == _ROOT_CONTENTS.sub(
        "", fetcher_response.text
    )
    assert browser_response.status_code == fetcher_response.status_code
    assert browser_response.headers["vary"] == "Sec-Fetch-Dest"
    assert browser_response.headers["cache-control"] == "no-cache"


@pytest.mark.parametrize(
    ("error", "note"),
    [
        (
            SearchBusyException,
            "Search is busy. Too many searches are running. Try again in a moment.",
        ),
        (
            SearchTimedOutException,
            "The search took too long. Choose a Parliament, report type or date "
            "range to narrow the search, then try again.",
        ),
        (
            SearchConstituencyNotFoundException,
            "No constituency called Tampines &amp; &lt;i&gt;Changkat&lt;/i&gt;. "
            "Check the spelling. A "
            "constituency can be listed under another name after its boundaries "
            "change.",
        ),
    ],
)
def test_a_search_that_fails_writes_the_line_the_app_shows(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, error: Exception, note: str
) -> None:
    def raise_error(*arguments: object) -> SearchSpeechesResponse:
        raise error

    monkeypatch.setattr(search_service, "search_speeches", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    response = client.get(
        "/search",
        params={"q": "default", "constituency": " Tampines & <i>Changkat</i> "},
    )

    assert response.status_code == status.HTTP_200_OK
    assert _get_root_contents(response.text).split("\n") == [
        "<main>",
        "<h1>Search</h1>",
        _COVERAGE_LINE,
        f"<p>{note}</p>",
        "</main>",
    ]


@pytest.mark.parametrize(
    ("query", "note"),
    [
        (
            "?q=-covid",
            "A minus sign excludes a word. Add a word to search for, or choose a "
            "person or constituency.",
        ),
        ("?q=default&page=51", "Couldn&#x27;t run the search."),
        ("?q=default&type=no-such-type", "Couldn&#x27;t run the search."),
        ("?q=default&from=1899-12-31", "Couldn&#x27;t run the search."),
        (f"?q={'a' * 257}", "Couldn&#x27;t run the search."),
    ],
)
def test_a_search_the_api_would_refuse_writes_a_line_and_runs_no_search(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str, note: str
) -> None:
    monkeypatch.setattr(search_service, "search_speeches", _fail_if_search_runs)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_contents = _get_root_contents(client.get(f"/search{query}").text)

    assert root_contents.split("\n") == [
        "<main>",
        "<h1>Search</h1>",
        _COVERAGE_LINE,
        f"<p>{note}</p>",
        "</main>",
    ]


@pytest.mark.parametrize(
    ("query", "lines"),
    [
        (
            "?q=zebrafinch",
            [
                '<p><a href="/search?q=zebrafinch&amp;tab=titles">Title matches</a></p>',
                "<p>No speech matches. All search terms must appear in the same "
                "paragraph. Try using fewer words. Common words like &quot;the&quot; "
                "are ignored.</p>",
            ],
        ),
        (
            "?person=7",
            ["<p>No speeches. Try a wider date range or another Parliament.</p>"],
        ),
    ],
)
def test_a_search_with_no_matches_says_so(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str, lines: list[str]
) -> None:
    monkeypatch.setattr(
        search_service,
        "search_speeches",
        lambda *arguments: _get_search_speeches_response([], False),
    )
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_contents = _get_root_contents(client.get(f"/search{query}").text)

    assert root_contents.split("\n") == [
        "<main>",
        "<h1>Search</h1>",
        _COVERAGE_LINE,
        *lines,
        "</main>",
    ]


def test_a_database_failure_leaves_the_search_root_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(*arguments: object) -> SearchSpeechesResponse:
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))

    monkeypatch.setattr(search_service, "search_speeches", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    response = client.get("/search?q=default")

    assert response.status_code == status.HTTP_200_OK
    assert _EMPTY_ROOT in response.text


def _get_report_match(report_slug: str, title: str) -> ReportMatchData:
    return ReportMatchData(
        report_slug=report_slug,
        title=title,
        report_type="bill",
        sitting_date=date(2020, 1, 1),
        parliament_number=14,
        is_text_available=True,
        snippet="",
    )


def _get_search_reports_response(
    results: list[ReportMatchData], has_next_page: bool
) -> SearchReportsResponse:
    return SearchReportsResponse(
        results=results,
        page=1,
        page_size=20,
        has_next_page=has_next_page,
        total_count=1_000,
        is_total_capped=True,
    )


def _fail_if_title_search_runs(*arguments: object) -> SearchReportsResponse:
    raise AssertionError("the title search should not run")


def test_a_title_search_lists_the_first_page_of_title_matches(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    search_arguments: list[tuple[object, ...]] = []

    def search_reports(*arguments: object) -> SearchReportsResponse:
        search_arguments.append(arguments[:-1])
        return _get_search_reports_response(
            [
                _get_report_match("bill-818", "SUPPLY BILL"),
                _get_report_match(
                    "00069110-ZZ_1#id004-budget", "<script>alert(1)</script>"
                ),
            ],
            True,
        )

    monkeypatch.setattr(search_service, "search_reports", search_reports)
    monkeypatch.setattr(search_service, "search_speeches", _fail_if_search_runs)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    response = client.get("/search?q=+default+interest+&type=bill&page=2&tab=titles")

    assert search_arguments == [
        (
            "default interest",
            None,
            None,
            None,
            ReportType.BILL,
            None,
            SearchSort.DATE,
            2,
            20,
        )
    ]
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["vary"] == "Sec-Fetch-Dest"
    assert _get_root_contents(response.text).split("\n") == [
        "<main>",
        "<h1>Search</h1>",
        _COVERAGE_LINE,
        "<p>more than 1,000 title matches</p>",
        '<p><a href="/search?q=+default+interest+&amp;type=bill">Speech matches</a></p>',
        "<ol>",
        '<li><a href="/reports/bill-818?hl=default+interest">SUPPLY BILL</a>, '
        '<time datetime="2020-01-01">1 January 2020</time></li>',
        '<li><a href="/reports/00069110-ZZ_1%23id004-budget?hl=default+interest">'
        "&lt;script&gt;alert(1)&lt;/script&gt;</a>, "
        '<time datetime="2020-01-01">1 January 2020</time></li>',
        "</ol>",
        '<p><a href="/search?q=+default+interest+&amp;type=bill&amp;tab=titles'
        '&amp;page=3">Next page</a></p>',
        "</main>",
    ]


@pytest.mark.parametrize(
    ("query", "is_text_available"),
    [("?q=tax&person=7&tab=titles", False), ("?q=tax&tab=titles", None)],
)
def test_a_title_search_asks_for_reports_without_text_while_a_person_is_chosen(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    query: str,
    is_text_available: Optional[bool],
) -> None:
    search_arguments: list[tuple[object, ...]] = []

    def search_reports(*arguments: object) -> SearchReportsResponse:
        search_arguments.append(arguments[:-1])
        return _get_search_reports_response([], False)

    monkeypatch.setattr(search_service, "search_reports", search_reports)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    client.get(f"/search{query}")

    assert search_arguments == [
        ("tax", None, None, None, None, is_text_available, SearchSort.DATE, 1, 20)
    ]


@pytest.mark.parametrize(
    "query",
    [
        "?q=tax&constituency=Tampines&tab=titles",
        "?person=7&tab=titles",
        "?q=-covid&person=7&tab=titles",
    ],
)
def test_a_title_tab_the_app_does_not_offer_lists_speech_matches(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str
) -> None:
    monkeypatch.setattr(search_service, "search_reports", _fail_if_title_search_runs)
    monkeypatch.setattr(
        search_service,
        "search_speeches",
        lambda *arguments: _get_search_speeches_response(
            [_get_speech_match("bill-818", "SUPPLY BILL", 3, "", "text")], False
        ),
    )
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_contents = _get_root_contents(client.get(f"/search{query}").text)

    assert '#s3">SUPPLY BILL</a>' in root_contents
    assert "tab=titles" not in root_contents


@pytest.mark.parametrize(
    ("query", "lines"),
    [
        (
            "?q=zebrafinch&tab=titles",
            [
                '<p><a href="/search?q=zebrafinch">Speech matches</a></p>',
                "<p>No title matches. All search terms must appear in the title. "
                "Try using fewer words. Common words like &quot;the&quot; are "
                "ignored.</p>",
            ],
        ),
        (
            "?type=bill&tab=titles",
            [
                '<p><a href="/search?type=bill">Speeches</a></p>',
                "<p>No reports. Try a wider date range or another Parliament.</p>",
            ],
        ),
    ],
)
def test_a_title_search_with_no_matches_says_so(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str, lines: list[str]
) -> None:
    monkeypatch.setattr(
        search_service,
        "search_reports",
        lambda *arguments: _get_search_reports_response([], False),
    )
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_contents = _get_root_contents(client.get(f"/search{query}").text)

    assert root_contents.split("\n") == [
        "<main>",
        "<h1>Search</h1>",
        _COVERAGE_LINE,
        *lines,
        "</main>",
    ]


@pytest.mark.parametrize(
    ("error", "note"),
    [
        (
            SearchBusyException,
            "Search is busy. Too many searches are running. Try again in a moment.",
        ),
        (
            SearchTimedOutException,
            "The search took too long. Choose a Parliament, report type or date "
            "range to narrow the search, then try again.",
        ),
    ],
)
def test_a_title_search_that_fails_writes_the_line_the_app_shows(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, error: Exception, note: str
) -> None:
    def raise_error(*arguments: object) -> SearchReportsResponse:
        raise error

    monkeypatch.setattr(search_service, "search_reports", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_contents = _get_root_contents(client.get("/search?q=tax&tab=titles").text)

    assert root_contents.split("\n") == [
        "<main>",
        "<h1>Search</h1>",
        _COVERAGE_LINE,
        f"<p>{note}</p>",
        "</main>",
    ]


@pytest.mark.parametrize(
    ("query", "root_contents"),
    [
        (
            "?q=-covid&tab=titles",
            "\n".join(
                [
                    "<main>",
                    "<h1>Search</h1>",
                    _COVERAGE_LINE,
                    "<p>A minus sign excludes a word. Add a word to search for, or "
                    "choose a person or constituency.</p>",
                    "</main>",
                ]
            ),
        ),
        ("?tab=titles", ""),
    ],
)
def test_a_title_search_the_api_would_refuse_runs_no_search(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str, root_contents: str
) -> None:
    monkeypatch.setattr(search_service, "search_reports", _fail_if_title_search_runs)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    assert _get_root_contents(client.get(f"/search{query}").text) == root_contents


def test_a_database_failure_leaves_the_title_search_root_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(*arguments: object) -> SearchReportsResponse:
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))

    monkeypatch.setattr(search_service, "search_reports", raise_error)
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    response = client.get("/search?q=tax&tab=titles")

    assert response.status_code == status.HTTP_200_OK
    assert _EMPTY_ROOT in response.text


@pytest.mark.parametrize(
    ("query", "total_count", "is_total_capped", "count_line"),
    [
        ("?q=tax&tab=titles", 1, False, "<p>1 title match</p>"),
        ("?q=tax&tab=titles", 2, False, "<p>2 title matches</p>"),
        ("?type=bill&tab=titles", 1, False, "<p>1 report</p>"),
        ("?type=bill&tab=titles", 1_000, True, "<p>more than 1,000 reports</p>"),
    ],
)
def test_a_title_search_counts_title_matches_or_reports(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    query: str,
    total_count: int,
    is_total_capped: bool,
    count_line: str,
) -> None:
    monkeypatch.setattr(
        search_service,
        "search_reports",
        lambda *arguments: SearchReportsResponse(
            results=[_get_report_match("bill-818", "SUPPLY BILL")],
            page=1,
            page_size=20,
            has_next_page=False,
            total_count=total_count,
            is_total_capped=is_total_capped,
        ),
    )
    client = _get_client(tmp_path, monkeypatch, _get_search_preview())

    root_lines = _get_root_contents(client.get(f"/search{query}").text).split("\n")

    assert root_lines[3] == count_line

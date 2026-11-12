import re
from datetime import date
from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from sqlmodel import Session
from starlette.applications import Starlette
from starlette.routing import Mount

from enums import PreviewType
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from middleware import frontend
from schemas.parliament import GetAllParliamentsResponse, ParliamentData
from schemas.preview import PreviewData
from schemas.report import GetReportResponse, SpeechData
from schemas.sitting import GetAllSittingsResponse, SittingData
from services import parliament as parliament_service
from services import preview as preview_service
from services import report as report_service
from services import sitting as sitting_service

_REPO_ROOT = Path(__file__).resolve().parents[2]
_ROOT_CONTENTS = re.compile(r'<div id="root">(.*)</div>', re.DOTALL)
_EMPTY_ROOT = '<div id="root"></div>'


def _get_report_preview() -> PreviewData:
    return PreviewData(
        title="Bill, 1 January 2020",
        description="A report.",
        preview_type=PreviewType.ARTICLE,
        path="/reports/bill-818",
        is_found=True,
        report_title="Bill",
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


def _get_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, preview: PreviewData
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
            routes=[Mount("/", frontend.FrontendFiles(tmp_path, None), name="frontend")]
        )
    )


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
            _get_speech(4, "", "(Applause)"),
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
        "<p><strong>Mr Speaker</strong>: Order. Second Reading.</p>",
        "<p><strong>Mr Tan</strong>: Sir, I beg to move.</p>",
        "<p>And so  the *Bill* stands.</p>",
        "<p>(Applause)</p>",
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
        ("/people/1-tan", preview_service.get_default_preview()),
        ("/sittings/2020-01-01", preview_service.get_default_preview()),
        ("/search", preview_service.get_default_preview()),
        ("/coverage", preview_service.get_default_preview()),
    ],
)
def test_a_page_that_is_not_a_found_report_or_home_gets_no_text(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, path: str, preview: PreviewData
) -> None:
    monkeypatch.setattr(report_service, "get_report", _fail_if_report_is_read)
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


def test_the_home_page_links_parliaments_people_and_recent_sittings(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
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
        sitting_date=None,
    )
    client = _get_client(tmp_path, monkeypatch, home_preview)

    root_contents = _get_root_contents(client.get("/").text)

    assert root_contents.split("\n") == [
        "<main>",
        "<h1>Open Hansard</h1>",
        "<p>Singapore&#x27;s Hansard &amp; more.</p>",
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

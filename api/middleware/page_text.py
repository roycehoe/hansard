import re
from html import escape

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from database.engine import engine
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from schemas.parliament import ParliamentData
from schemas.preview import PreviewData
from schemas.report import GetReportResponse
from schemas.sitting import SittingData
from services import parliament as parliament_service
from services import report as report_service
from services import sitting as sitting_service
from utils.sitting_date import get_sitting_date_label

_NO_PAGE_TEXT = ""
_NO_ROOT_ELEMENT = ""
_NO_SPEAKER_LABEL = ""
_NO_SUBTITLE = ""
_ROOT_ELEMENT = '<div id="root"></div>'
_LINE_SEPARATOR = "\n"
_HOME_PATH = "/"
_REPORT_PATH = re.compile(r"^/reports/([^/]+)$")
_PEOPLE_PATH = "/people"
_PEOPLE_LINK_TEXT = "Members of Parliament"
_PARLIAMENTS_HEADING = "Parliaments"
_RECENT_SITTINGS_HEADING = "Recent sittings"
_RECENT_SITTING_COUNT = 5
_LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0
_LEGISLATIVE_ASSEMBLY_LABEL = "Legislative Assembly"


def _get_paragraph_html(
    speaker_label: str, previous_speaker_label: str, transcript: str
) -> str:
    if speaker_label == _NO_SPEAKER_LABEL or speaker_label == previous_speaker_label:
        return f"<p>{escape(transcript)}</p>"
    return f"<p><strong>{escape(speaker_label)}</strong>: {escape(transcript)}</p>"


def _get_report_html(report: GetReportResponse) -> str:
    previous_speaker_labels = [
        _NO_SPEAKER_LABEL,
        *[speech.speaker_label for speech in report.speeches],
    ]
    paragraphs = [
        _get_paragraph_html(
            speech.speaker_label, previous_speaker_label, speech.transcript
        )
        for speech, previous_speaker_label in zip(
            report.speeches, previous_speaker_labels
        )
    ]
    subtitle_paragraphs = (
        [] if report.subtitle == _NO_SUBTITLE else [f"<p>{escape(report.subtitle)}</p>"]
    )
    return _LINE_SEPARATOR.join(
        [
            "<main>",
            f"<h1>{escape(report.title)}</h1>",
            *subtitle_paragraphs,
            f'<p><time datetime="{escape(report.sitting_date.isoformat())}">'
            f"{escape(get_sitting_date_label(report.sitting_date))}</time></p>",
            *paragraphs,
            "</main>",
        ]
    )


def _get_parliament_label(parliament_number: int) -> str:
    if parliament_number == _LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER:
        return _LEGISLATIVE_ASSEMBLY_LABEL
    return f"Parliament {parliament_number}"


def _get_home_html(
    title: str,
    description: str,
    parliaments: list[ParliamentData],
    recent_sittings: list[SittingData],
) -> str:
    parliament_items = [
        f'<li><a href="/sittings?parliament={escape(str(parliament.parliament_number))}">'
        f"{escape(_get_parliament_label(parliament.parliament_number))}</a></li>"
        for parliament in parliaments
    ]
    sitting_items = [
        f'<li><a href="/sittings/{escape(sitting.sitting_date.isoformat())}">'
        f"{escape(get_sitting_date_label(sitting.sitting_date))}</a></li>"
        for sitting in recent_sittings
    ]
    return _LINE_SEPARATOR.join(
        [
            "<main>",
            f"<h1>{escape(title)}</h1>",
            f"<p>{escape(description)}</p>",
            f'<p><a href="{_PEOPLE_PATH}">{_PEOPLE_LINK_TEXT}</a></p>',
            f"<h2>{_PARLIAMENTS_HEADING}</h2>",
            "<ul>",
            *parliament_items,
            "</ul>",
            f"<h2>{_RECENT_SITTINGS_HEADING}</h2>",
            "<ul>",
            *sitting_items,
            "</ul>",
            "</main>",
        ]
    )


def _get_report_page_text_html(report_slug: str) -> str:
    try:
        with Session(engine) as session:
            return _get_report_html(
                report_service.get_report(report_slug, None, None, session)
            )
    except ReportNotFoundException:
        return _NO_PAGE_TEXT
    except ReportTakenDownException:
        return _NO_PAGE_TEXT
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_home_page_text_html(title: str, description: str) -> str:
    try:
        with Session(engine) as session:
            parliaments = parliament_service.get_all_parliaments(session).parliaments
            if not parliaments:
                return _NO_PAGE_TEXT
            latest_parliament_number = max(
                parliament.parliament_number for parliament in parliaments
            )
            sittings = sitting_service.get_all_sittings(
                latest_parliament_number, session
            ).sittings
            recent_sittings = sorted(
                sittings, key=lambda sitting: sitting.sitting_date, reverse=True
            )[:_RECENT_SITTING_COUNT]
            return _get_home_html(title, description, parliaments, recent_sittings)
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


# NOTE: a report is the only page whose preview carries a sitting date, so a report that was not found costs no second lookup
def get_page_text_html(path: str, preview: PreviewData) -> str:
    if path == _HOME_PATH:
        return _get_home_page_text_html(preview.title, preview.description)
    report_match = _REPORT_PATH.match(path)
    if report_match is None:
        return _NO_PAGE_TEXT
    if preview.sitting_date is None:
        return _NO_PAGE_TEXT
    return _get_report_page_text_html(report_match.group(1))


# NOTE: createRoot in app/src/main.tsx empties #root on its first render, so React replaces this text rather than hydrating it, and the text need not match the React markup
def get_index_html_with_page_text(index_html: str, page_text_html: str) -> str:
    head, root_element, tail = index_html.partition(_ROOT_ELEMENT)
    if root_element == _NO_ROOT_ELEMENT:
        return index_html
    return f'{head}<div id="root">{page_text_html}</div>{tail}'

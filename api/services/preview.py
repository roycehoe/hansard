import re
from dataclasses import dataclass
from datetime import date, datetime, time
from time import monotonic
from typing import Optional
from urllib.parse import quote, urlencode

from sqlmodel import Session

from crud.person import CRUDPerson
from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.report import Report
from database.speech import Speech
from enums import PreviewType
from schemas.preview import PreviewData
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug
from utils.sitting_date import get_sitting_date_label
from utils.speech_link import get_linked_speech_ordinal, get_speech_anchor
from utils.transcript_snippet import get_transcript_quote

_CACHE_TTL_SECONDS = 60 * 60
_CACHE_MAX_ENTRIES = 500
_EMPTY_ANCHOR = ""
_EMPTY_LABEL = ""
_NOT_OFFICIAL = "This is not an official Parliament site."
_UNOFFICIAL_TRANSCRIPT = "Unofficial transcript"
_DEFAULT_TITLE = "Open Hansard"
_DEFAULT_DESCRIPTION = f"Singapore's parliamentary debates since 1955. {_NOT_OFFICIAL}"
_PERSON_DESCRIPTION = f"Speeches in Singapore's parliamentary debates. {_NOT_OFFICIAL}"
_REPORT_PATH = re.compile(r"^/reports/([^/]+)$")
_PERSON_PATH = re.compile(r"^/people/(\d+)(?:-[^/]*)?$")
_SITTING_PATH = re.compile(r"^/sittings/(\d{4}-\d{2}-\d{2})$")
_HOME_PATH = "/"
_URL_SEPARATOR = "/"
_UNTITLED_PAGE_PATHS = (_HOME_PATH, "/design", "/palette", "/researchers")
_COVERAGE_PATH = "/coverage"
_METHODS_PATH = "/coverage/methods"
_SEARCH_PATH = "/search"
_PEOPLE_PATH = "/people"
_SITTINGS_PATH = "/sittings"
_COVERAGE_TITLE = "What the archive covers"
_METHODS_TITLE = "Data quality and methods"
_SEARCH_TITLE = "Search"
_PEOPLE_TITLE = "People"
_SITTINGS_TITLE = "Sittings"
_SPEECH_ORDINAL_PARAMETER = "s"
_SPEECH_ANCHOR_PARAMETER = "q"
_REPORT_WORD = "report"
_REPORTS_WORD = "reports"


@dataclass(frozen=True)
class _CachedPreview:
    expires_at: float
    preview: PreviewData


# NOTE: replaced whole and never mutated, so a request thread never reads a half-written entry
_cache_key_to_cached_preview: dict[tuple[str, Optional[int], str], _CachedPreview] = {}


def get_default_preview() -> PreviewData:
    return PreviewData(
        title=_DEFAULT_TITLE,
        description=_DEFAULT_DESCRIPTION,
        preview_type=PreviewType.WEBSITE,
        path=_HOME_PATH,
        is_found=True,
        report_title=_EMPTY_LABEL,
        sitting_date=None,
    )


def get_not_found_preview() -> PreviewData:
    return PreviewData(
        title=_DEFAULT_TITLE,
        description=_DEFAULT_DESCRIPTION,
        preview_type=PreviewType.WEBSITE,
        path=_HOME_PATH,
        is_found=False,
        report_title=_EMPTY_LABEL,
        sitting_date=None,
    )


def _get_fixed_page_title(path: str) -> Optional[str]:
    if path == _COVERAGE_PATH:
        return _COVERAGE_TITLE
    if path == _METHODS_PATH:
        return _METHODS_TITLE
    if path == _SEARCH_PATH:
        return _SEARCH_TITLE
    if path == _PEOPLE_PATH:
        return _PEOPLE_TITLE
    if path == _SITTINGS_PATH:
        return _SITTINGS_TITLE
    return None


def _get_fixed_preview(path: str) -> PreviewData:
    title = _get_fixed_page_title(path)
    if title is not None:
        return PreviewData(
            title=title,
            description=_DEFAULT_DESCRIPTION,
            preview_type=PreviewType.WEBSITE,
            path=path,
            is_found=True,
            report_title=_EMPTY_LABEL,
            sitting_date=None,
        )
    if path in _UNTITLED_PAGE_PATHS:
        return get_default_preview()
    return get_not_found_preview()


def _get_speech_ordinal(speech_ordinal_text: Optional[str]) -> Optional[int]:
    if speech_ordinal_text is None:
        return None
    try:
        return int(speech_ordinal_text)
    except ValueError:
        return None


def _get_report_by_slug(report_slug: str, session: Session) -> Optional[Report]:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is not None:
            return report
    return None


def _get_report_path(report: Report) -> str:
    return f"/reports/{quote(get_report_slug(report.report_id), safe='')}"


def _get_report_preview(report: Report) -> PreviewData:
    sitting_date_label = get_sitting_date_label(report.sitting_date.date())
    return PreviewData(
        title=f"{report.title}, {sitting_date_label}",
        description=f"From the sitting of {sitting_date_label}. {_NOT_OFFICIAL}",
        preview_type=PreviewType.ARTICLE,
        path=_get_report_path(report),
        is_found=True,
        report_title=report.title,
        sitting_date=report.sitting_date.date(),
    )


def _get_speech_title(speech: Speech, report: Report) -> str:
    sitting_date_label = get_sitting_date_label(report.sitting_date.date())
    if speech.speaker is None or speech.speaker == _EMPTY_LABEL:
        return f"{report.title}, {sitting_date_label}"
    return f"{speech.speaker}, {sitting_date_label}"


def _get_speech_preview(
    report: Report, speech_ordinal: int, speech_anchor: str, session: Session
) -> PreviewData:
    speeches = CRUDSpeech(session).get_all_by_report_id(report.id)
    ordinal_to_anchor = {
        speech.ordinal: get_speech_anchor(speech.transcript) for speech in speeches
    }
    linked_ordinal = get_linked_speech_ordinal(
        ordinal_to_anchor, speech_ordinal, speech_anchor
    )
    if linked_ordinal is None:
        return _get_report_preview(report)
    ordinal_to_speech = {speech.ordinal: speech for speech in speeches}
    linked_speech = ordinal_to_speech[linked_ordinal]
    query = urlencode(
        {
            _SPEECH_ORDINAL_PARAMETER: linked_ordinal,
            _SPEECH_ANCHOR_PARAMETER: ordinal_to_anchor[linked_ordinal],
        }
    )
    return PreviewData(
        title=f"{_UNOFFICIAL_TRANSCRIPT}: {_get_speech_title(linked_speech, report)}",
        description=f"{get_transcript_quote(linked_speech.transcript)} {_NOT_OFFICIAL}",
        preview_type=PreviewType.ARTICLE,
        path=f"{_get_report_path(report)}?{query}",
        is_found=True,
        report_title=report.title,
        sitting_date=report.sitting_date.date(),
    )


def _get_person_preview(person_id: int, session: Session) -> PreviewData:
    person = CRUDPerson(session).get(person_id)
    if person is None:
        return get_not_found_preview()
    return PreviewData(
        title=person.canonical_name,
        description=_PERSON_DESCRIPTION,
        preview_type=PreviewType.WEBSITE,
        path=f"/people/{person.id}-{get_person_slug(person.canonical_name)}",
        is_found=True,
        report_title=_EMPTY_LABEL,
        sitting_date=None,
    )


def _get_sitting_preview(sitting_date: date, session: Session) -> PreviewData:
    reports = CRUDReport(session).get_all_by_sitting_date(
        datetime.combine(sitting_date, time.min)
    )
    if not reports:
        return get_not_found_preview()
    report_count = len(reports)
    word = _REPORT_WORD if report_count == 1 else _REPORTS_WORD
    return PreviewData(
        title=f"Sitting of {get_sitting_date_label(sitting_date)}",
        description=f"{report_count:,} {word}. {_NOT_OFFICIAL}",
        preview_type=PreviewType.WEBSITE,
        path=f"/sittings/{sitting_date.isoformat()}",
        is_found=True,
        report_title=_EMPTY_LABEL,
        sitting_date=None,
    )


def _get_uncached_preview(
    path: str, speech_ordinal: Optional[int], speech_anchor: str, session: Session
) -> PreviewData:
    report_match = _REPORT_PATH.match(path)
    if report_match is not None:
        report = _get_report_by_slug(report_match.group(1), session)
        if report is None:
            return get_not_found_preview()
        if speech_ordinal is None or speech_anchor == _EMPTY_ANCHOR:
            return _get_report_preview(report)
        return _get_speech_preview(report, speech_ordinal, speech_anchor, session)
    person_match = _PERSON_PATH.match(path)
    if person_match is not None:
        return _get_person_preview(int(person_match.group(1)), session)
    sitting_match = _SITTING_PATH.match(path)
    if sitting_match is not None:
        return _get_sitting_preview(date.fromisoformat(sitting_match.group(1)), session)
    return get_not_found_preview()


def _is_database_path(path: str) -> bool:
    return (
        _REPORT_PATH.match(path) is not None
        or _PERSON_PATH.match(path) is not None
        or _SITTING_PATH.match(path) is not None
    )


def _get_cache_with_preview(
    cache_key: tuple[str, Optional[int], str], preview: PreviewData
) -> dict[tuple[str, Optional[int], str], _CachedPreview]:
    now = monotonic()
    live_entries = [
        (key, cached_preview)
        for key, cached_preview in _cache_key_to_cached_preview.items()
        if now < cached_preview.expires_at and key != cache_key
    ]
    kept_entries = live_entries[-(_CACHE_MAX_ENTRIES - 1) :]
    return {
        **dict(kept_entries),
        cache_key: _CachedPreview(now + _CACHE_TTL_SECONDS, preview),
    }


def get_preview(
    path: str,
    speech_ordinal_text: Optional[str],
    speech_anchor_text: Optional[str],
    session: Session,
) -> PreviewData:
    global _cache_key_to_cached_preview
    page_path = path.rstrip(_URL_SEPARATOR) or _HOME_PATH
    if not _is_database_path(page_path):
        return _get_fixed_preview(page_path)
    speech_ordinal = _get_speech_ordinal(speech_ordinal_text)
    speech_anchor = (
        _EMPTY_ANCHOR
        if speech_anchor_text is None
        else get_speech_anchor(speech_anchor_text)
    )
    cache_key = (page_path, speech_ordinal, speech_anchor)
    cached_preview = _cache_key_to_cached_preview.get(cache_key)
    if cached_preview is not None and monotonic() < cached_preview.expires_at:
        return cached_preview.preview
    preview = _get_uncached_preview(page_path, speech_ordinal, speech_anchor, session)
    if preview.is_found:
        _cache_key_to_cached_preview = _get_cache_with_preview(cache_key, preview)
    return preview

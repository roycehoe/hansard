import re
from dataclasses import dataclass
from datetime import date, datetime, time
from time import monotonic
from typing import Optional
from urllib.parse import quote, urlencode

from sqlmodel import Session

from crud.attendance import CRUDAttendance
from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.report import Report
from database.speaker import Speaker
from database.speech import Speech
from enums import PreviewType
from middleware.membership import get_membership_id_to_person
from middleware.takedown import get_taken_down_report_ids
from schemas.preview import PreviewData
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug
from utils.sitting_date import get_sitting_date_label
from utils.speaker_label import is_chair_speaker_label
from utils.speech_link import get_linked_speech_ordinal, get_speech_anchor
from utils.transcript_snippet import get_paragraph_quote, get_transcript_quote

_CACHE_TTL_SECONDS = 60 * 60
_CACHE_MAX_ENTRIES = 500
_EMPTY_ANCHOR = ""
_EMPTY_LABEL = ""
_NOT_OFFICIAL = "This is not an official Parliament site."
_UNOFFICIAL_TRANSCRIPT = "Unofficial transcript"
_DEFAULT_TITLE = "Open Hansard"
_DEFAULT_DESCRIPTION = f"Singapore's parliamentary debates since 1955. {_NOT_OFFICIAL}"
_PERSON_DESCRIPTION = f"Speeches in Singapore's parliamentary debates. {_NOT_OFFICIAL}"
_PERSON_TITLE_SUFFIX = "speeches in Parliament"
_LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0
_LEGISLATIVE_ASSEMBLY_LABEL = "Legislative Assembly"
_SEAT_SEPARATOR = ", "
_NAME_SEPARATOR = ", "
_LISTED_SPEAKER_COUNT = 3
_LISTED_REPORT_COUNT = 3
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


def _get_names_label(names: list[str]) -> str:
    if len(names) == 1:
        return names[0]
    return f"{_NAME_SEPARATOR.join(names[:-1])} and {names[-1]}"


def _get_ranked_speaker_names(report_id: int, session: Session) -> list[str]:
    debate_speeches = [
        speech
        for speech in CRUDSpeech(session).get_all_by_report_id(report_id)
        if speech.speaker_id is not None
        and not is_chair_speaker_label(speech.speaker or _EMPTY_LABEL)
    ]
    membership_id_to_person = get_membership_id_to_person(
        list({speech.speaker_id for speech in debate_speeches}), session
    )
    person_id_to_name: dict[int, str] = {}
    person_id_to_paragraph_count: dict[int, int] = {}
    for speech in debate_speeches:
        person = membership_id_to_person.get(speech.speaker_id)
        if person is None:
            continue
        person_id_to_name[person.id] = person.canonical_name
        person_id_to_paragraph_count[person.id] = (
            person_id_to_paragraph_count.get(person.id, 0) + 1
        )
    ranked_person_ids = sorted(
        person_id_to_paragraph_count,
        key=lambda person_id: person_id_to_paragraph_count[person_id],
        reverse=True,
    )
    return [person_id_to_name[person_id] for person_id in ranked_person_ids]


def _get_speakers_sentence(speaker_names: list[str]) -> str:
    listed_names = _get_names_label(speaker_names[:_LISTED_SPEAKER_COUNT])
    if len(speaker_names) > _LISTED_SPEAKER_COUNT:
        return f"{len(speaker_names):,} people spoke, among them {listed_names}."
    return f"{listed_names} spoke."


def _get_report_description(
    report_id: int, sitting_date_label: str, session: Session
) -> str:
    first_speech = CRUDSpeech(session).get_first_by_report_id(report_id)
    if (
        first_speech is None
        or first_speech.speaker is None
        or first_speech.speaker == _EMPTY_LABEL
    ):
        speaker_names = _get_ranked_speaker_names(report_id, session)
        if not speaker_names:
            return f"From the sitting of {sitting_date_label}. {_NOT_OFFICIAL}"
        return f"{_get_speakers_sentence(speaker_names)} {_NOT_OFFICIAL}"
    paragraph_quote = get_paragraph_quote(first_speech.speaker, first_speech.transcript)
    return f"{paragraph_quote} {_NOT_OFFICIAL}"


def _get_report_preview(report: Report, session: Session) -> PreviewData:
    sitting_date_label = get_sitting_date_label(report.sitting_date.date())
    return PreviewData(
        title=f"{report.title}, {sitting_date_label}",
        description=_get_report_description(report.id, sitting_date_label, session),
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
        return _get_report_preview(report, session)
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


def _get_parliament_label(parliament_number: int) -> str:
    if parliament_number == _LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER:
        return _LEGISLATIVE_ASSEMBLY_LABEL
    return f"Parliament {parliament_number}"


def _get_parliament_range_label(memberships: list[Speaker]) -> str:
    first_label = _get_parliament_label(memberships[0].parliament_number)
    last_label = _get_parliament_label(memberships[-1].parliament_number)
    if first_label == last_label:
        return first_label
    return f"{first_label} to {last_label}"


def _get_seat_labels(membership: Speaker, session: Session) -> list[str]:
    membership_id_to_location_names = CRUDAttendance(
        session
    ).get_membership_id_to_location_names_by_membership_ids([membership.id])
    labels = [
        membership.party,
        *membership_id_to_location_names.get(membership.id, []),
    ]
    return [label for label in labels if label != _EMPTY_LABEL]


def _get_person_description(person_id: int, session: Session) -> str:
    memberships = CRUDMembership(session).get_all_by_person_id(person_id)
    report_id_to_speech_count = CRUDSpeech(
        session
    ).get_report_id_to_speech_count_by_membership_ids(
        [membership.id for membership in memberships]
    )
    report_count = len(
        set(report_id_to_speech_count).difference(get_taken_down_report_ids(session))
    )
    if report_count == 0:
        return _PERSON_DESCRIPTION
    word = _REPORT_WORD if report_count == 1 else _REPORTS_WORD
    sentences = [
        f"Speeches in {report_count:,} {word}, {_get_parliament_range_label(memberships)}."
    ]
    seat_labels = _get_seat_labels(memberships[-1], session)
    if seat_labels:
        sentences.append(f"{_SEAT_SEPARATOR.join(seat_labels)}.")
    sentences.append(_NOT_OFFICIAL)
    return " ".join(sentences)


def _get_person_preview(person_id: int, session: Session) -> PreviewData:
    person = CRUDPerson(session).get(person_id)
    if person is None:
        return get_not_found_preview()
    return PreviewData(
        title=f"{person.canonical_name}, {_PERSON_TITLE_SUFFIX}",
        description=_get_person_description(person.id, session),
        preview_type=PreviewType.WEBSITE,
        path=f"/people/{person.id}-{get_person_slug(person.canonical_name)}",
        is_found=True,
        report_title=_EMPTY_LABEL,
        sitting_date=None,
    )


def _get_reports_sentence(reports: list[Report]) -> str:
    listed_titles = _get_names_label(
        [f'"{report.title}"' for report in reports[:_LISTED_REPORT_COUNT]]
    )
    if len(reports) > _LISTED_REPORT_COUNT:
        return f"{len(reports):,} reports, among them {listed_titles}."
    return f"{listed_titles}."


def _get_sitting_preview(sitting_date: date, session: Session) -> PreviewData:
    reports = CRUDReport(session).get_all_by_sitting_date(
        datetime.combine(sitting_date, time.min)
    )
    if not reports:
        return get_not_found_preview()
    return PreviewData(
        title=f"Sitting of {get_sitting_date_label(sitting_date)}",
        description=f"{_get_reports_sentence(reports)} {_NOT_OFFICIAL}",
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
            return _get_report_preview(report, session)
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

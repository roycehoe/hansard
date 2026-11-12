from typing import Optional

from sqlmodel import Session

from crud.report import CRUDReport
from crud.report_asker import CRUDReportAsker
from crud.report_link import CRUDReportLink
from crud.speech import CRUDSpeech
from database.person import Person
from database.report import Report
from database.report_asker import ReportAsker
from database.report_link import ReportLink
from database.speech import Speech
from enums import (
    ReportLinkRelation,
    ReportLinkType,
    ReportType,
    SearchEndpoint,
    SpeechLinkStatus,
)
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from middleware.membership import get_membership_id_to_person
from middleware.search_slot import hold_search_slot
from middleware.takedown import is_report_id_taken_down
from schemas.report import (
    AskerData,
    GetReportMatchedWordsResponse,
    GetReportResponse,
    ReferencedReportData,
    SpeechData,
    SpeechLinkData,
)
from schemas.report_link import GetReportLinksResponse, ReportLinkData
from utils.marked_words import get_marked_words
from utils.official_record import get_official_record_url
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug
from utils.report_title import get_whitespace_collapsed_title
from utils.search_query import (
    get_quoted_words_to_mark,
    get_search_query_groups,
    get_stemmed_websearch_query,
)
from utils.speaker_label import is_shared_role_speaker_label
from utils.speech_link import get_linked_speech_ordinal, get_speech_anchor

_EMPTY_ANCHOR = ""


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is None:
            continue
        if is_report_id_taken_down(report.report_id):
            raise ReportTakenDownException
        return report
    raise ReportNotFoundException


def _get_speech_data(
    speech: Speech,
    anchor: str,
    is_shared_role_credit: bool,
    membership_id_to_person: dict[int, Person],
) -> SpeechData:
    person = (
        membership_id_to_person.get(speech.speaker_id)
        if speech.speaker_id is not None
        else None
    )
    if person is None:
        return SpeechData(
            ordinal=speech.ordinal,
            speaker_label=speech.speaker or "",
            transcript=speech.transcript,
            kind=speech.kind,
            person_id=None,
            person_slug="",
            person_name="",
            is_shared_role_credit=False,
            anchor=anchor,
            column_start=speech.column_start,
            column_note=speech.column_note,
            column_suggested=speech.column_suggested,
        )
    return SpeechData(
        ordinal=speech.ordinal,
        speaker_label=speech.speaker or "",
        transcript=speech.transcript,
        kind=speech.kind,
        person_id=person.id,
        person_slug=get_person_slug(person.canonical_name),
        person_name=person.canonical_name,
        is_shared_role_credit=is_shared_role_credit,
        anchor=anchor,
        column_start=speech.column_start,
        column_note=speech.column_note,
        column_suggested=speech.column_suggested,
    )


def _is_parliamentary_question(report_type: str) -> bool:
    return (
        report_type == ReportType.ORAL_ANSWER
        or report_type == ReportType.WRITTEN_ANSWER
        or report_type == ReportType.WRITTEN_ANSWER_NA
    )


def _get_asker_data(
    askers: list[ReportAsker], membership_id_to_person: dict[int, Person]
) -> list[AskerData]:
    asker_data: list[AskerData] = []
    for asker in askers:
        person = (
            membership_id_to_person.get(asker.speaker_id)
            if asker.speaker_id is not None
            else None
        )
        if person is None:
            continue
        reader_person = (
            membership_id_to_person.get(asker.reader_speaker_id)
            if asker.reader_speaker_id is not None
            else None
        )
        asker_data.append(
            AskerData(
                person_id=person.id,
                person_slug=get_person_slug(person.canonical_name),
                person_name=person.canonical_name,
                printed_name=asker.printed_name,
                reader_person_name=(
                    reader_person.canonical_name if reader_person is not None else ""
                ),
            )
        )
    return asker_data


def _get_speech_link_data(
    ordinal_to_anchor: dict[int, str],
    speech_ordinal: Optional[int],
    speech_anchor: Optional[str],
) -> Optional[SpeechLinkData]:
    if speech_ordinal is None or speech_anchor is None:
        return None
    requested_anchor = get_speech_anchor(speech_anchor)
    if requested_anchor == _EMPTY_ANCHOR:
        return None
    linked_ordinal = get_linked_speech_ordinal(
        ordinal_to_anchor, speech_ordinal, requested_anchor
    )
    if linked_ordinal is None:
        return SpeechLinkData(status=SpeechLinkStatus.MISSING, ordinal=None)
    if linked_ordinal == speech_ordinal:
        return SpeechLinkData(status=SpeechLinkStatus.FOUND, ordinal=linked_ordinal)
    return SpeechLinkData(status=SpeechLinkStatus.MOVED, ordinal=linked_ordinal)


def _get_referenced_report_data(
    title: str, report_type: ReportType, sitting_reports: list[Report]
) -> Optional[ReferencedReportData]:
    collapsed_title = get_whitespace_collapsed_title(title)
    same_title_reports = [
        sitting_report
        for sitting_report in sitting_reports
        if sitting_report.report_type == report_type
        and get_whitespace_collapsed_title(sitting_report.title) == collapsed_title
    ]
    if len(same_title_reports) != 1:
        return None
    return ReferencedReportData(
        report_slug=get_report_slug(same_title_reports[0].report_id),
        title=same_title_reports[0].title,
    )


def _get_sitting_neighbour_data(
    sitting_reports: list[Report], neighbour_index: int
) -> Optional[ReferencedReportData]:
    if not 0 <= neighbour_index < len(sitting_reports):
        return None
    neighbour = sitting_reports[neighbour_index]
    return ReferencedReportData(
        report_slug=get_report_slug(neighbour.report_id), title=neighbour.title
    )


def _get_sitting_reports(report: Report, session: Session) -> list[Report]:
    return [
        sitting_report
        for sitting_report in CRUDReport(session).get_all_by_sitting_date(
            report.sitting_date
        )
        if not is_report_id_taken_down(sitting_report.report_id)
    ]


def _is_correction_report(report_type: str) -> bool:
    return (
        report_type == ReportType.CLARIFICATION
        or report_type == ReportType.WRITTEN_STATEMENT
    )


def _get_other_report_id(report_link: ReportLink, viewed_report_id: str) -> str:
    if report_link.source_report_id == viewed_report_id:
        return report_link.target_report_id
    return report_link.source_report_id


def _get_viewed_report_links(report_id: str, session: Session) -> list[ReportLink]:
    printed_report_links = CRUDReportLink(session).get_all_by_source_report_id(
        report_id
    )
    corrected_report_ids = {
        report_link.target_report_id
        for report_link in printed_report_links
        if report_link.link_type == ReportLinkType.CORRECTION
    }
    return printed_report_links + [
        report_link
        for report_link in CRUDReportLink(
            session
        ).get_all_by_target_report_id_and_link_type(
            report_id, ReportLinkType.CORRECTION
        )
        if report_link.source_report_id not in corrected_report_ids
    ]


def _get_report_link_relation(
    report_link: ReportLink, is_viewed_report_the_source: bool, source_report_type: str
) -> ReportLinkRelation:
    if report_link.link_type == ReportLinkType.REPLY:
        return ReportLinkRelation.REFERS_TO
    if report_link.link_type == ReportLinkType.CONTINUATION:
        return ReportLinkRelation.CONTINUES
    if _is_correction_report(source_report_type) == is_viewed_report_the_source:
        return ReportLinkRelation.CORRECTS
    return ReportLinkRelation.CORRECTED_BY


def _get_report_link_data(
    report_link: ReportLink,
    report: Report,
    report_id_to_other_report: dict[str, Report],
) -> ReportLinkData:
    other_report = report_id_to_other_report[
        _get_other_report_id(report_link, report.report_id)
    ]
    is_viewed_report_the_source = report_link.source_report_id == report.report_id
    return ReportLinkData(
        relation=_get_report_link_relation(
            report_link,
            is_viewed_report_the_source,
            report.report_type
            if is_viewed_report_the_source
            else other_report.report_type,
        ),
        report_slug=get_report_slug(other_report.report_id),
        title=other_report.title,
        subtitle=other_report.subtitle or "",
        report_type=other_report.report_type,
        sitting_date=other_report.sitting_date.date(),
        printed_citation=report_link.printed_citation,
    )


def get_report_links(report_slug: str, session: Session) -> GetReportLinksResponse:
    report = _get_validated_report(report_slug, session)
    report_links = [
        report_link
        for report_link in _get_viewed_report_links(report.report_id, session)
        if not is_report_id_taken_down(
            _get_other_report_id(report_link, report.report_id)
        )
    ]
    report_id_to_other_report = {
        other_report.report_id: other_report
        for other_report in CRUDReport(session).get_all_by_report_ids(
            [
                _get_other_report_id(report_link, report.report_id)
                for report_link in report_links
            ]
        )
    }
    return GetReportLinksResponse(
        links=sorted(
            (
                _get_report_link_data(report_link, report, report_id_to_other_report)
                for report_link in report_links
            ),
            key=lambda report_link_data: (
                report_link_data.sitting_date,
                report_link_data.report_slug,
            ),
        )
    )


def get_report(
    report_slug: str,
    speech_ordinal: Optional[int],
    speech_anchor: Optional[str],
    session: Session,
) -> GetReportResponse:
    report = _get_validated_report(report_slug, session)
    speeches = CRUDSpeech(session).get_all_by_report_id(report.id)
    ordinal_to_anchor = {
        speech.ordinal: get_speech_anchor(speech.transcript) for speech in speeches
    }
    speaker_label_to_is_shared_role = {
        speaker_label: is_shared_role_speaker_label(speaker_label)
        for speaker_label in {speech.speaker or "" for speech in speeches}
    }
    askers = (
        CRUDReportAsker(session).get_all_by_report_id(report.id)
        if _is_parliamentary_question(report.report_type)
        else []
    )
    membership_ids = sorted(
        {speech.speaker_id for speech in speeches if speech.speaker_id is not None}
        | {asker.speaker_id for asker in askers if asker.speaker_id is not None}
        | {
            asker.reader_speaker_id
            for asker in askers
            if asker.reader_speaker_id is not None
        }
    )
    membership_id_to_person = get_membership_id_to_person(membership_ids, session)
    sitting_reports = _get_sitting_reports(report, session)
    report_index = [sitting_report.id for sitting_report in sitting_reports].index(
        report.id
    )
    return GetReportResponse(
        report_slug=get_report_slug(report.report_id),
        title=report.title,
        subtitle=report.subtitle or "",
        report_type=report.report_type,
        parliament_number=report.parliament_number,
        volume_number=report.volume_number,
        sitting_number=report.sitting_number,
        sitting_date=report.sitting_date.date(),
        official_record_url=get_official_record_url(
            report.report_id, report.report_version, report.html_file_name
        ),
        is_text_available=len(speeches) > 0,
        speeches=[
            _get_speech_data(
                speech,
                ordinal_to_anchor[speech.ordinal],
                speaker_label_to_is_shared_role[speech.speaker or ""],
                membership_id_to_person,
            )
            for speech in speeches
        ],
        askers=_get_asker_data(askers, membership_id_to_person),
        speech_link=_get_speech_link_data(
            ordinal_to_anchor, speech_ordinal, speech_anchor
        ),
        referenced_written_answer=(
            _get_referenced_report_data(
                report.title,
                ReportType.WRITTEN_ANSWER_NA,
                sitting_reports,
            )
            if report.report_type == ReportType.ORAL_ANSWER
            else None
        ),
        referencing_oral_answer=(
            _get_referenced_report_data(
                report.title,
                ReportType.ORAL_ANSWER,
                sitting_reports,
            )
            if report.report_type == ReportType.WRITTEN_ANSWER_NA
            else None
        ),
        previous_report=_get_sitting_neighbour_data(sitting_reports, report_index - 1),
        next_report=_get_sitting_neighbour_data(sitting_reports, report_index + 1),
    )


def get_report_matched_words(
    report_slug: str, words: str, session: Session
) -> GetReportMatchedWordsResponse:
    with hold_search_slot(SearchEndpoint.MATCHED_WORDS):
        report = _get_validated_report(report_slug, session)
        groups = get_search_query_groups(words)
        quoted_words = set(get_quoted_words_to_mark(groups))
        stemmed_websearch_query = get_stemmed_websearch_query(groups)
        if stemmed_websearch_query == "":
            return GetReportMatchedWordsResponse(words=sorted(quoted_words))
        marked_transcripts = CRUDSpeech(
            session
        ).get_all_marked_transcripts_by_report_id_and_query(
            report.id, stemmed_websearch_query
        )
        return GetReportMatchedWordsResponse(
            words=sorted(quoted_words | set(get_marked_words(marked_transcripts)))
        )

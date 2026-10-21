from typing import Optional

from sqlmodel import Session

from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.person import Person
from database.report import Report
from database.speech import Speech
from enums import SpeechLinkStatus
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from middleware.membership import get_membership_id_to_person
from middleware.takedown import is_report_id_taken_down
from schemas.report import (
    GetReportMatchedWordsResponse,
    GetReportResponse,
    SpeechData,
    SpeechLinkData,
)
from utils.marked_words import get_marked_words
from utils.official_record import get_official_record_url
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug
from utils.speaker_label import is_shared_role_speaker_label
from utils.speech_link import get_linked_speech_ordinal, get_speech_anchor

_EMPTY_ANCHOR = ""
_OR_OPERATOR = " OR "


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
        )
    return SpeechData(
        ordinal=speech.ordinal,
        speaker_label=speech.speaker or "",
        transcript=speech.transcript,
        kind=speech.kind,
        person_id=person.id,
        person_slug=get_person_slug(person.canonical_name),
        person_name=person.canonical_name,
        is_shared_role_credit=is_shared_role_speaker_label(speech.speaker or ""),
        anchor=anchor,
    )


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
    membership_ids = sorted(
        {speech.speaker_id for speech in speeches if speech.speaker_id is not None}
    )
    membership_id_to_person = get_membership_id_to_person(membership_ids, session)
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
                membership_id_to_person,
            )
            for speech in speeches
        ],
        speech_link=_get_speech_link_data(
            ordinal_to_anchor, speech_ordinal, speech_anchor
        ),
    )


def get_report_matched_words(
    report_slug: str, words: str, session: Session
) -> GetReportMatchedWordsResponse:
    report = _get_validated_report(report_slug, session)
    marked_transcripts = CRUDSpeech(
        session
    ).get_all_marked_transcripts_by_report_id_and_query(
        report.id, _OR_OPERATOR.join(words.split())
    )
    return GetReportMatchedWordsResponse(words=get_marked_words(marked_transcripts))

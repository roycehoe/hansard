from sqlmodel import Session

from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.person import Person
from database.report import Report
from database.speech import Speech
from exceptions.report import ReportNotFoundException
from middleware.membership import get_membership_id_to_person
from schemas.report import GetReportResponse, SpeechData
from utils.official_record import get_official_record_url
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is not None:
            return report
    raise ReportNotFoundException


def _get_speech_data(
    speech: Speech, membership_id_to_person: dict[int, Person]
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
        )
    return SpeechData(
        ordinal=speech.ordinal,
        speaker_label=speech.speaker or "",
        transcript=speech.transcript,
        kind=speech.kind,
        person_id=person.id,
        person_slug=get_person_slug(person.canonical_name),
        person_name=person.canonical_name,
    )


def get_report(report_slug: str, session: Session) -> GetReportResponse:
    report = _get_validated_report(report_slug, session)
    speeches = CRUDSpeech(session).get_all_by_report_id(report.id)
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
            _get_speech_data(speech, membership_id_to_person) for speech in speeches
        ],
    )

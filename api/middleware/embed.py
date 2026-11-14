from dataclasses import dataclass
from typing import Optional

from fastapi import status
from sqlmodel import Session

from exceptions.report import ReportNotFoundException, ReportTakenDownException
from schemas.report import GetReportResponse, SpeechData
from services import report as report_service
from utils.embed_html import get_notice_embed_html, get_speech_embed_html

_MAX_SPEECH_ORDINAL_DIGITS = 9
_MAX_SPEECH_ANCHOR_LENGTH = 200
_REPORT_NOT_FOUND_TITLE = "Report not found"
_REPORT_NOT_FOUND_DESCRIPTION = "No report has this address."
_REPORT_REMOVED_TITLE = "Report removed"
_REPORT_REMOVED_DESCRIPTION = "This report is no longer on this site."
_PARAGRAPH_NOT_FOUND_TITLE = "Paragraph not found"
_PARAGRAPH_NOT_FOUND_DESCRIPTION = (
    "The paragraph this link pointed to is no longer in this report."
)


@dataclass(frozen=True)
class SpeechEmbed:
    html: str
    status_code: int


# NOTE: the s and q limits of GET /reports/{report_slug}; a value it would refuse with 422 counts as no paragraph, so the frame shows the notice in place of the API's JSON and the report's takedown and not-found answers still apply
def _get_speech_ordinal(
    speech_ordinal_text: Optional[str], speech_anchor: Optional[str]
) -> Optional[int]:
    if speech_ordinal_text is None:
        return None
    if not speech_ordinal_text.isdecimal():
        return None
    if len(speech_ordinal_text) > _MAX_SPEECH_ORDINAL_DIGITS:
        return None
    if speech_anchor is not None and len(speech_anchor) > _MAX_SPEECH_ANCHOR_LENGTH:
        return None
    return int(speech_ordinal_text)


# NOTE: the report page's own rule: a link with q follows the paragraph to its new ordinal or finds it missing, and a link with only s names the ordinal
def _get_linked_speech(
    report: GetReportResponse, speech_ordinal: Optional[int]
) -> Optional[SpeechData]:
    linked_ordinal = (
        speech_ordinal if report.speech_link is None else report.speech_link.ordinal
    )
    return next(
        (speech for speech in report.speeches if speech.ordinal == linked_ordinal),
        None,
    )


def get_speech_embed(
    report_slug: str,
    speech_ordinal_text: Optional[str],
    speech_anchor: Optional[str],
    session: Session,
) -> SpeechEmbed:
    speech_ordinal = _get_speech_ordinal(speech_ordinal_text, speech_anchor)
    try:
        report = report_service.get_report(
            report_slug, speech_ordinal, speech_anchor, session
        )
    except ReportNotFoundException as error:
        return SpeechEmbed(
            get_notice_embed_html(
                _REPORT_NOT_FOUND_TITLE, _REPORT_NOT_FOUND_DESCRIPTION
            ),
            error.status_code,
        )
    except ReportTakenDownException as error:
        return SpeechEmbed(
            get_notice_embed_html(_REPORT_REMOVED_TITLE, _REPORT_REMOVED_DESCRIPTION),
            error.status_code,
        )
    speech = _get_linked_speech(report, speech_ordinal)
    if speech is None:
        return SpeechEmbed(
            get_notice_embed_html(
                _PARAGRAPH_NOT_FOUND_TITLE, _PARAGRAPH_NOT_FOUND_DESCRIPTION
            ),
            status.HTTP_404_NOT_FOUND,
        )
    return SpeechEmbed(
        get_speech_embed_html(
            report.title,
            report.sitting_date,
            report.report_slug,
            speech.ordinal,
            speech.anchor,
            speech.speaker_label,
            speech.transcript,
        ),
        status.HTTP_200_OK,
    )

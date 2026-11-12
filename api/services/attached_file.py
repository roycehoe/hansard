from sqlmodel import Session

from crud.attached_file import CRUDAttachedFile
from crud.attached_file_pointer import CRUDAttachedFilePointer
from crud.report import CRUDReport
from database.attached_file import AttachedFile
from database.report import Report
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from middleware.takedown import is_report_id_taken_down
from schemas.attached_file import (
    AttachedFileData,
    AttachedFilePointerData,
    GetReportAttachedFilesResponse,
)
from utils.attached_file_url import get_attached_file_url
from utils.report_slug import get_report_id_candidates


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is None:
            continue
        if is_report_id_taken_down(report.report_id):
            raise ReportTakenDownException
        return report
    raise ReportNotFoundException


def _get_attached_file_data(attached_file: AttachedFile) -> AttachedFileData:
    return AttachedFileData(
        kind=attached_file.kind,
        printed_title=attached_file.printed_title,
        file_name=attached_file.file_name,
        section_type=attached_file.section_type,
    )


def get_report_attached_files(
    report_slug: str, session: Session
) -> GetReportAttachedFilesResponse:
    report = _get_validated_report(report_slug, session)
    pointers = CRUDAttachedFilePointer(session).get_all_by_sprs_report_ids(
        [report.report_id]
    )
    attached_file_ids = sorted(
        {
            pointer.attached_file_id
            for pointer in pointers
            if pointer.attached_file_id is not None
        }
    )
    attached_file_id_to_attached_file = {
        attached_file.id: attached_file
        for attached_file in CRUDAttachedFile(session).get_by_ids(attached_file_ids)
    }
    return GetReportAttachedFilesResponse(
        pointers=[
            AttachedFilePointerData(
                ordinal=pointer.ordinal,
                printed_text=pointer.printed_text,
                url=get_attached_file_url(pointer.download_value),
                speech_ordinal=pointer.speech_ordinal,
                file=(
                    None
                    if pointer.attached_file_id is None
                    else _get_attached_file_data(
                        attached_file_id_to_attached_file[pointer.attached_file_id]
                    )
                ),
            )
            for pointer in pointers
        ]
    )

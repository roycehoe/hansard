from datetime import date, datetime, time

from sqlmodel import Session

from crud.attached_file import CRUDAttachedFile
from crud.attached_file_pointer import CRUDAttachedFilePointer
from crud.report import CRUDReport
from crud.sitting import CRUDSitting
from database.attached_file import AttachedFile
from database.attached_file_pointer import AttachedFilePointer
from database.report import Report
from database.sitting import Sitting
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from exceptions.sitting import SittingNotFoundException
from middleware.takedown import is_report_id_taken_down
from schemas.attached_file import (
    AttachedFileData,
    AttachedFilePointerData,
    GetReportAttachedFilesResponse,
    GetSittingAttachedFilesResponse,
    SittingAttachedFileData,
    SittingAttachedFilePointerData,
)
from utils.attached_file_url import get_attached_file_url
from utils.report_slug import get_report_id_candidates, get_report_slug
from utils.sitting_date import get_sitting_date_text


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is None:
            continue
        if is_report_id_taken_down(report.report_id):
            raise ReportTakenDownException
        return report
    raise ReportNotFoundException


def _get_validated_sitting(sitting_date: date, session: Session) -> Sitting:
    sitting = CRUDSitting(session).get_by_sitting_date(
        get_sitting_date_text(sitting_date)
    )
    if sitting is None:
        raise SittingNotFoundException
    return sitting


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


def _get_sitting_attached_file_pointer_data(
    report: Report, pointer: AttachedFilePointer
) -> SittingAttachedFilePointerData:
    return SittingAttachedFilePointerData(
        report_slug=get_report_slug(report.report_id),
        report_title=report.title,
        ordinal=pointer.ordinal,
        printed_text=pointer.printed_text,
        url=get_attached_file_url(pointer.download_value),
        speech_ordinal=pointer.speech_ordinal,
    )


def get_sitting_attached_files(
    sitting_date: date, session: Session
) -> GetSittingAttachedFilesResponse:
    sitting = _get_validated_sitting(sitting_date, session)
    reports = CRUDReport(session).get_all_by_sitting_date(
        datetime.combine(sitting_date, time.min)
    )
    pointers = CRUDAttachedFilePointer(session).get_all_by_sprs_report_ids(
        [report.report_id for report in reports]
    )
    report_id_to_pointers: dict[str, list[AttachedFilePointer]] = {
        report.report_id: [] for report in reports
    }
    for pointer in pointers:
        report_id_to_pointers[pointer.sprs_report_id].append(pointer)
    report_and_pointers_to_show = [
        (report, pointer)
        for report in reports
        if not is_report_id_taken_down(report.report_id)
        for pointer in report_id_to_pointers[report.report_id]
    ]
    attached_file_ids_with_pointers = {
        pointer.attached_file_id
        for pointer in pointers
        if pointer.attached_file_id is not None
    }
    attached_files = CRUDAttachedFile(session).get_all_by_sitting_id(sitting.id)
    attached_file_id_to_pointers = {
        attached_file.id: [
            _get_sitting_attached_file_pointer_data(report, pointer)
            for report, pointer in report_and_pointers_to_show
            if pointer.attached_file_id == attached_file.id
        ]
        for attached_file in attached_files
    }
    return GetSittingAttachedFilesResponse(
        files=[
            SittingAttachedFileData(
                kind=attached_file.kind,
                printed_title=attached_file.printed_title,
                file_name=attached_file.file_name,
                section_type=attached_file.section_type,
                url=get_attached_file_url(attached_file.download_value),
                pointers=attached_file_id_to_pointers[attached_file.id],
            )
            for attached_file in attached_files
            if attached_file.id not in attached_file_ids_with_pointers
            or attached_file_id_to_pointers[attached_file.id]
        ],
        unlisted_pointers=[
            _get_sitting_attached_file_pointer_data(report, pointer)
            for report, pointer in report_and_pointers_to_show
            if pointer.attached_file_id is None
        ],
    )

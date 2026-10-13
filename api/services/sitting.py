from datetime import date, datetime, time

from exceptions.sitting import SittingNotFoundException
from sqlmodel import Session

from crud.attendance import CRUDAttendance
from crud.report import CRUDReport
from crud.sitting import CRUDSitting
from database.attendance import Attendance
from database.person import Person
from database.report import Report
from database.sitting import Sitting
from middleware.membership import get_membership_id_to_person
from schemas.sitting import (
    AttendanceData,
    GetAllSittingsResponse,
    GetSittingResponse,
    SittingData,
    SittingReportData,
)
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_slug
from utils.sitting_date import get_sitting_date_text


def _get_validated_sitting(sitting_date: date, session: Session) -> Sitting:
    sitting = CRUDSitting(session).get_by_sitting_date(
        get_sitting_date_text(sitting_date)
    )
    if sitting is None:
        raise SittingNotFoundException
    return sitting


def _get_validated_reports(sitting_date: date, session: Session) -> list[Report]:
    reports = CRUDReport(session).get_all_by_sitting_date(
        datetime.combine(sitting_date, time.min)
    )
    if not reports:
        raise SittingNotFoundException
    return reports


def _build_attendance_data(
    attendance: Attendance, membership_id_to_person: dict[int, Person]
) -> AttendanceData:
    person = (
        membership_id_to_person.get(attendance.speaker_id)
        if attendance.speaker_id is not None
        else None
    )
    if person is None:
        return AttendanceData(
            name=attendance.speaker_name or "",
            is_present=bool(attendance.is_present),
            constituency=attendance.location_name or "",
            person_id=None,
            person_slug="",
            person_name="",
        )
    return AttendanceData(
        name=attendance.speaker_name or "",
        is_present=bool(attendance.is_present),
        constituency=attendance.location_name or "",
        person_id=person.id,
        person_slug=get_person_slug(person.canonical_name),
        person_name=person.canonical_name,
    )


def get_sitting(sitting_date: date, session: Session) -> GetSittingResponse:
    sitting = _get_validated_sitting(sitting_date, session)
    reports = _get_validated_reports(sitting_date, session)
    report_ids_with_text = set(
        CRUDReport(session).get_all_ids_with_text_by_ids(
            [report.id for report in reports]
        )
    )
    attendances = CRUDAttendance(session).get_all_by_sitting_id(sitting.id)
    membership_ids = sorted(
        {
            attendance.speaker_id
            for attendance in attendances
            if attendance.speaker_id is not None
        }
    )
    membership_id_to_person = get_membership_id_to_person(membership_ids, session)
    sitting_numbers = [
        report.sitting_number for report in reports if report.sitting_number is not None
    ]
    return GetSittingResponse(
        sitting_date=sitting_date,
        parliament_number=reports[0].parliament_number,
        volume_number=reports[0].volume_number,
        sitting_number=max(sitting_numbers, default=None),
        session_number=sitting.session_no,
        reports=[
            SittingReportData(
                report_slug=get_report_slug(report.report_id),
                title=report.title,
                subtitle=report.subtitle or "",
                report_type=report.report_type,
                speech_number=report.speech_number,
                is_text_available=report.id in report_ids_with_text,
            )
            for report in reports
        ],
        is_attendance_available=len(attendances) > 0,
        attendance=[
            _build_attendance_data(attendance, membership_id_to_person)
            for attendance in attendances
        ],
    )


def get_all_sittings(
    parliament_number: int, session: Session
) -> GetAllSittingsResponse:
    sitting_date_to_volume_number = CRUDReport(
        session
    ).get_sitting_date_to_volume_number_by_parliament_number(parliament_number)
    sitting_date_to_sitting_number = CRUDReport(
        session
    ).get_sitting_date_to_sitting_number_by_parliament_number(parliament_number)
    sitting_date_to_report_count = CRUDReport(
        session
    ).get_sitting_date_to_report_count_by_parliament_number(parliament_number)
    sitting_date_texts = [
        get_sitting_date_text(sitting_date.date())
        for sitting_date in sitting_date_to_volume_number
    ]
    sitting_date_text_to_session_number = CRUDSitting(
        session
    ).get_sitting_date_to_session_number_by_sitting_dates(sitting_date_texts)
    sittings = [
        SittingData(
            sitting_date=sitting_date.date(),
            parliament_number=parliament_number,
            volume_number=volume_number,
            sitting_number=sitting_date_to_sitting_number[sitting_date],
            session_number=sitting_date_text_to_session_number.get(
                get_sitting_date_text(sitting_date.date())
            ),
            report_count=sitting_date_to_report_count[sitting_date],
        )
        for sitting_date, volume_number in sitting_date_to_volume_number.items()
    ]
    return GetAllSittingsResponse(sittings=sittings)

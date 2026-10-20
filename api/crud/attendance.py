from sqlalchemy import func, true
from sqlmodel import Session, select

from database.attendance import Attendance
from database.report import Report
from database.sitting import Sitting

_SITTING_DATE_FORMAT = "DD-MM-YYYY"


class CRUDAttendance:
    def __init__(self, session: Session):
        self.session = session

    def get_parliament_number_to_count_by_membership_ids_and_is_present(
        self, membership_ids: list[int], is_present: bool
    ) -> dict[int, int]:
        sitting_date = func.to_date(Sitting.sitting_date, _SITTING_DATE_FORMAT)
        # NOTE: equality on the sitting date, not a cast of it, so each sitting probes the report index; every report is dated midnight, and a one-day range's cost estimate set off JIT
        sitting_parliament_numbers = (
            select(Report.parliament_number)
            .where(Report.sitting_date == sitting_date)
            .distinct()
            .lateral()
        )
        statement = (
            select(sitting_parliament_numbers.c.parliament_number, func.count())
            .select_from(Attendance)
            .join(Sitting, Sitting.id == Attendance.sitting_id)
            .join(sitting_parliament_numbers, true())
            .where(Attendance.speaker_id.in_(membership_ids))
            .where(Attendance.is_present.is_(is_present))
            .group_by(sitting_parliament_numbers.c.parliament_number)
        )
        rows = self.session.exec(statement).all()
        return {
            parliament_number: attendance_count
            for parliament_number, attendance_count in rows
        }

    def get_all_by_sitting_id(self, sitting_id: int) -> list[Attendance]:
        statement = (
            select(Attendance)
            .where(Attendance.sitting_id == sitting_id)
            .order_by(Attendance.is_present.desc(), Attendance.speaker_name)
        )
        return list(self.session.exec(statement).all())

    def get_membership_id_to_location_names_by_membership_ids(
        self, membership_ids: list[int]
    ) -> dict[int, list[str]]:
        statement = (
            select(Attendance.speaker_id, Attendance.location_name)
            .where(Attendance.speaker_id.in_(membership_ids))
            .where(Attendance.location_name.is_not(None))
            .distinct()
            .order_by(Attendance.speaker_id, Attendance.location_name)
        )
        rows = self.session.exec(statement).all()
        membership_id_to_location_names: dict[int, list[str]] = {}
        for membership_id, location_name in rows:
            membership_id_to_location_names.setdefault(membership_id, []).append(
                location_name
            )
        return membership_id_to_location_names

    def get_count(self) -> int:
        statement = select(func.count()).select_from(Attendance)
        return self.session.exec(statement).one()

    def get_count_with_membership_id(self) -> int:
        statement = (
            select(func.count())
            .select_from(Attendance)
            .where(Attendance.speaker_id.is_not(None))
        )
        return self.session.exec(statement).one()

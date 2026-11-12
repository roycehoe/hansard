from datetime import date

from sqlalchemy import func
from sqlmodel import Session, col, select

from database.attendance import Attendance
from database.attendance_office import AttendanceOffice
from database.sitting import Sitting

_SITTING_DATE_FORMAT = "DD-MM-YYYY"


class CRUDAttendanceOffice:
    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, attendance_office_ids: list[int]) -> list[AttendanceOffice]:
        statement = select(AttendanceOffice).where(
            col(AttendanceOffice.id).in_(attendance_office_ids)
        )
        return list(self.session.exec(statement).all())

    def get_sitting_date_to_attendance_office_by_membership_id_and_office_printed_and_sitting_date_from_and_sitting_date_to(
        self,
        membership_id: int,
        office_printed: str,
        sitting_date_from: date,
        sitting_date_to: date,
    ) -> dict[date, AttendanceOffice]:
        sitting_date = func.to_date(Sitting.sitting_date, _SITTING_DATE_FORMAT)
        statement = (
            select(sitting_date, AttendanceOffice)
            .join(Attendance, col(Attendance.id) == AttendanceOffice.attendance_id)
            .join(Sitting, col(Sitting.id) == Attendance.sitting_id)
            .where(Attendance.speaker_id == membership_id)
            .where(AttendanceOffice.office_printed == office_printed)
            .where(sitting_date >= sitting_date_from)
            .where(sitting_date <= sitting_date_to)
        )
        return {
            row_sitting_date: attendance_office
            for row_sitting_date, attendance_office in self.session.exec(
                statement
            ).all()
        }

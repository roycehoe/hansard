from sqlmodel import Session, col, select

from database.attendance_office import AttendanceOffice


class CRUDAttendanceOffice:
    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, attendance_office_ids: list[int]) -> list[AttendanceOffice]:
        statement = select(AttendanceOffice).where(
            col(AttendanceOffice.id).in_(attendance_office_ids)
        )
        return list(self.session.exec(statement).all())

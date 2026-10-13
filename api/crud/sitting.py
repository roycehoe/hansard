from datetime import date
from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from database.attendance import Attendance
from database.sitting import Sitting

_SITTING_DATE_FORMAT = "DD-MM-YYYY"


class CRUDSitting:
    def __init__(self, session: Session):
        self.session = session

    def get_by_sitting_date(self, sitting_date_text: str) -> Optional[Sitting]:
        statement = select(Sitting).where(Sitting.sitting_date == sitting_date_text)
        return self.session.exec(statement).first()

    def get_sitting_date_to_session_number_by_sitting_dates(
        self, sitting_date_texts: list[str]
    ) -> dict[str, Optional[int]]:
        statement = select(Sitting.sitting_date, Sitting.session_no).where(
            Sitting.sitting_date.in_(sitting_date_texts)
        )
        rows = self.session.exec(statement).all()
        return {sitting_date: session_number for sitting_date, session_number in rows}

    def get_count(self) -> int:
        statement = select(func.count()).select_from(Sitting)
        return self.session.exec(statement).one()

    def get_max_sitting_date_with_attendance(self) -> Optional[date]:
        sitting_ids_with_attendance = (
            select(Attendance.sitting_id).distinct().subquery()
        )
        statement = select(
            func.max(func.to_date(Sitting.sitting_date, _SITTING_DATE_FORMAT))
        ).join(
            sitting_ids_with_attendance,
            sitting_ids_with_attendance.c.sitting_id == Sitting.id,
        )
        return self.session.exec(statement).one()

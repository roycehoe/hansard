from sqlmodel import Session, col, select

from database.minutes_division import MinutesDivision


class CRUDMinutesDivision:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_division_id(self, division_id: int) -> list[MinutesDivision]:
        statement = (
            select(MinutesDivision)
            .where(MinutesDivision.division_id == division_id)
            .order_by(col(MinutesDivision.minutes_id), col(MinutesDivision.ordinal))
        )
        return list(self.session.exec(statement).all())

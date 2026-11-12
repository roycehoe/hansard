from sqlmodel import Session, col, select

from database.leave_period import LeavePeriod


class CRUDLeavePeriod:
    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, leave_period_ids: list[int]) -> list[LeavePeriod]:
        statement = (
            select(LeavePeriod)
            .where(col(LeavePeriod.id).in_(leave_period_ids))
            .order_by(col(LeavePeriod.start_date).desc().nulls_last(), LeavePeriod.id)
        )
        return list(self.session.exec(statement).all())

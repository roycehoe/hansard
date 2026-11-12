from sqlmodel import Session, col, select

from database.bill import Bill


class CRUDBill:
    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, bill_ids: list[int]) -> list[Bill]:
        statement = (
            select(Bill).where(col(Bill.id).in_(bill_ids)).order_by(col(Bill.id))
        )
        return list(self.session.exec(statement).all())

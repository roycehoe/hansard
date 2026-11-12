from sqlmodel import Session, col, select

from database.bill_key import BillKey


class CRUDBillKey:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_bill_ids(self, bill_ids: list[int]) -> list[BillKey]:
        statement = (
            select(BillKey)
            .where(col(BillKey.bill_id).in_(bill_ids))
            .order_by(col(BillKey.bill_id))
        )
        return list(self.session.exec(statement).all())

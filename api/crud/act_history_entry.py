from sqlmodel import Session, col, select

from database.act import Act
from database.act_history_entry import ActHistoryEntry


class CRUDActHistoryEntry:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_act_id(self, act_id: int) -> list[ActHistoryEntry]:
        statement = (
            select(ActHistoryEntry)
            .where(ActHistoryEntry.act_id == act_id)
            .order_by(col(ActHistoryEntry.ordinal))
        )
        return list(self.session.exec(statement).all())

    def get_all_by_bill_id(self, bill_id: int) -> list[ActHistoryEntry]:
        statement = (
            select(ActHistoryEntry)
            .join(Act, col(Act.id) == col(ActHistoryEntry.act_id))
            .where(ActHistoryEntry.bill_id == bill_id)
            .order_by(col(Act.sso_code), col(ActHistoryEntry.ordinal))
        )
        return list(self.session.exec(statement).all())

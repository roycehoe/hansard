from typing import Optional

from sqlmodel import Session, col, select

from database.act import Act


class CRUDAct:
    def __init__(self, session: Session):
        self.session = session

    def get_by_sso_code(self, sso_code: str) -> Optional[Act]:
        statement = select(Act).where(Act.sso_code == sso_code)
        return self.session.exec(statement).first()

    def get_by_ids(self, act_ids: list[int]) -> list[Act]:
        statement = (
            select(Act).where(col(Act.id).in_(act_ids)).order_by(col(Act.sso_code))
        )
        return list(self.session.exec(statement).all())

    def get_all(self) -> list[Act]:
        statement = select(Act).order_by(col(Act.title), col(Act.id))
        return list(self.session.exec(statement).all())

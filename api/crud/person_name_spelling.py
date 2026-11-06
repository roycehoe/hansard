from sqlmodel import Session, col, select

from database.person_name_spelling import PersonNameSpelling


class CRUDPersonNameSpelling:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_person_ids(self, person_ids: list[int]) -> list[PersonNameSpelling]:
        statement = (
            select(PersonNameSpelling)
            .where(col(PersonNameSpelling.person_id).in_(person_ids))
            .order_by(
                col(PersonNameSpelling.person_id), col(PersonNameSpelling.ordinal)
            )
        )
        return list(self.session.exec(statement).all())

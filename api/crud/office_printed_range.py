from sqlmodel import Session, select

from database.office_printed_range import OfficePrintedRange


class CRUDOfficePrintedRange:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_membership_id(self, membership_id: int) -> list[OfficePrintedRange]:
        statement = (
            select(OfficePrintedRange)
            .where(OfficePrintedRange.speaker_id == membership_id)
            .order_by(OfficePrintedRange.first_sitting_date, OfficePrintedRange.id)
        )
        return list(self.session.exec(statement).all())

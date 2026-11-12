from sqlmodel import Session, col, select

from database.attached_file_pointer import AttachedFilePointer


class CRUDAttachedFilePointer:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_sprs_report_ids(
        self, sprs_report_ids: list[str]
    ) -> list[AttachedFilePointer]:
        statement = (
            select(AttachedFilePointer)
            .where(col(AttachedFilePointer.sprs_report_id).in_(sprs_report_ids))
            .order_by(
                col(AttachedFilePointer.sprs_report_id),
                col(AttachedFilePointer.ordinal),
            )
        )
        return list(self.session.exec(statement).all())

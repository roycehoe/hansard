from sqlmodel import Session, col, select

from database.attached_file import AttachedFile


class CRUDAttachedFile:
    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, attached_file_ids: list[int]) -> list[AttachedFile]:
        statement = select(AttachedFile).where(
            col(AttachedFile.id).in_(attached_file_ids)
        )
        return list(self.session.exec(statement).all())

    def get_all_by_sitting_id(self, sitting_id: int) -> list[AttachedFile]:
        statement = (
            select(AttachedFile)
            .where(AttachedFile.sitting_id == sitting_id)
            .order_by(col(AttachedFile.kind), col(AttachedFile.sprs_file_id))
        )
        return list(self.session.exec(statement).all())

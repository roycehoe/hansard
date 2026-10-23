from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from database.refresh_run import RefreshRun
from enums import RefreshRunStatus


class CRUDRefreshRun:
    def __init__(self, session: Session):
        self.session = session

    def get_latest_by_status(self, status: RefreshRunStatus) -> Optional[RefreshRun]:
        statement = (
            select(RefreshRun)
            .where(RefreshRun.status == status)
            .order_by(RefreshRun.started_at.desc())
        )
        return self.session.exec(statement).first()

    def get_latest_by_status_and_figures_type(
        self, status: RefreshRunStatus, figures_type: str
    ) -> Optional[RefreshRun]:
        statement = (
            select(RefreshRun)
            .where(RefreshRun.status == status)
            .where(func.jsonb_typeof(RefreshRun.figures) == figures_type)
            .order_by(RefreshRun.started_at.desc())
        )
        return self.session.exec(statement).first()

    def get_latest_with_finished_at(self) -> Optional[RefreshRun]:
        statement = (
            select(RefreshRun)
            .where(RefreshRun.finished_at.is_not(None))
            .order_by(RefreshRun.finished_at.desc())
        )
        return self.session.exec(statement).first()

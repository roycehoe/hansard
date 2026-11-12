import pytest
from sqlmodel import Session, SQLModel, select

from database.attendance import Attendance
from database.engine import engine
from database.leave_period import LeavePeriod
from database.leave_period_printing import LeavePeriodPrinting
from database.party_affiliation import PartyAffiliation
from database.person import Person
from database.person_name_spelling import PersonNameSpelling
from database.refresh_run import RefreshRun
from database.report import Report
from database.report_asker import ReportAsker
from database.report_link import ReportLink
from database.seat_holding import SeatHolding
from database.sitting import Sitting
from database.speaker import Speaker
from database.speech import Speech

pytestmark = [pytest.mark.database, pytest.mark.schema_drift]


@pytest.mark.parametrize(
    "model",
    [
        Attendance,
        LeavePeriod,
        LeavePeriodPrinting,
        PartyAffiliation,
        Person,
        PersonNameSpelling,
        RefreshRun,
        Report,
        ReportAsker,
        ReportLink,
        SeatHolding,
        Sitting,
        Speaker,
        Speech,
    ],
    ids=lambda model: model.__tablename__,
)
def test_every_column_the_model_declares_exists_in_the_table(
    model: type[SQLModel],
) -> None:
    with Session(engine) as session:
        rows = session.exec(select(model).limit(0)).all()

    assert rows == []

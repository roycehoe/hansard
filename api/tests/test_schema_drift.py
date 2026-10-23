import pytest
from sqlmodel import Session, SQLModel, select

from database.attendance import Attendance
from database.engine import engine
from database.party_affiliation import PartyAffiliation
from database.person import Person
from database.refresh_run import RefreshRun
from database.report import Report
from database.sitting import Sitting
from database.speaker import Speaker
from database.speech import Speech

pytestmark = [pytest.mark.database, pytest.mark.schema_drift]


@pytest.mark.parametrize(
    "model",
    [
        Attendance,
        PartyAffiliation,
        Person,
        RefreshRun,
        Report,
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

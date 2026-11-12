import pytest
from sqlmodel import Session, SQLModel, select

from database.act import Act
from database.act_history_entry import ActHistoryEntry
from database.attached_file import AttachedFile
from database.attached_file_pointer import AttachedFilePointer
from database.attendance import Attendance
from database.attendance_office import AttendanceOffice
from database.bill import Bill
from database.bill_key import BillKey
from database.bill_report import BillReport
from database.bill_report_speaker import BillReportSpeaker
from database.bill_stage_line import BillStageLine
from database.engine import engine
from database.leave_period import LeavePeriod
from database.leave_period_printing import LeavePeriodPrinting
from database.ministry import Ministry
from database.ministry_see_also import MinistrySeeAlso
from database.office_printed_range import OfficePrintedRange
from database.office_title_ministry import OfficeTitleMinistry
from database.party_affiliation import PartyAffiliation
from database.person import Person
from database.person_name_spelling import PersonNameSpelling
from database.refresh_run import RefreshRun
from database.report import Report
from database.report_asker import ReportAsker
from database.report_link import ReportLink
from database.report_participant import ReportParticipant
from database.report_put_to import ReportPutTo
from database.seat_holding import SeatHolding
from database.sitting import Sitting
from database.speaker import Speaker
from database.speech import Speech

pytestmark = [pytest.mark.database, pytest.mark.schema_drift]


@pytest.mark.parametrize(
    "model",
    [
        Act,
        ActHistoryEntry,
        AttachedFile,
        AttachedFilePointer,
        Attendance,
        AttendanceOffice,
        Bill,
        BillKey,
        BillReport,
        BillReportSpeaker,
        BillStageLine,
        LeavePeriod,
        LeavePeriodPrinting,
        Ministry,
        MinistrySeeAlso,
        OfficePrintedRange,
        OfficeTitleMinistry,
        PartyAffiliation,
        Person,
        PersonNameSpelling,
        RefreshRun,
        Report,
        ReportAsker,
        ReportLink,
        ReportParticipant,
        ReportPutTo,
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

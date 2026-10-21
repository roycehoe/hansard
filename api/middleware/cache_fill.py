from sqlmodel import Session

from database.engine import engine
from services import coverage as coverage_service
from services import parliament as parliament_service


# NOTE: one session each, so a failure in one leaves the other's transaction clean; nothing is caught, so a down database prints the traceback and the first request fills as before
def fill_coverage_and_parliament_caches() -> None:
    with Session(engine) as session:
        coverage_service.get_coverage(session)
    with Session(engine) as session:
        parliament_service.get_all_parliaments(session)

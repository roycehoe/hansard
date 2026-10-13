from sqlmodel import Session

from crud.report import CRUDReport
from schemas.parliament import GetAllParliamentsResponse, ParliamentData


def get_all_parliaments(session: Session) -> GetAllParliamentsResponse:
    parliament_number_to_sitting_count = CRUDReport(
        session
    ).get_parliament_number_to_sitting_count()
    parliament_number_to_report_count = CRUDReport(
        session
    ).get_parliament_number_to_report_count()
    parliament_number_to_text_report_count = CRUDReport(
        session
    ).get_parliament_number_to_text_report_count()
    parliament_number_to_first_sitting_date = CRUDReport(
        session
    ).get_parliament_number_to_first_sitting_date()
    parliament_number_to_last_sitting_date = CRUDReport(
        session
    ).get_parliament_number_to_last_sitting_date()
    return GetAllParliamentsResponse(
        parliaments=[
            ParliamentData(
                parliament_number=parliament_number,
                sitting_count=parliament_number_to_sitting_count[parliament_number],
                report_count=parliament_number_to_report_count[parliament_number],
                text_report_count=parliament_number_to_text_report_count[
                    parliament_number
                ],
                first_sitting_date=parliament_number_to_first_sitting_date[
                    parliament_number
                ].date(),
                last_sitting_date=parliament_number_to_last_sitting_date[
                    parliament_number
                ].date(),
            )
            for parliament_number in sorted(parliament_number_to_report_count)
        ]
    )

from dataclasses import dataclass
from enum import StrEnum, unique
from typing import Final, Mapping, TypedDict

from fastapi import HTTPException, status


@unique
class ErrorCode(StrEnum):
    REPORT_NOT_FOUND = "report.not_found"
    REPORT_TAKEN_DOWN = "report.taken_down"
    SITTING_NOT_FOUND = "sitting.not_found"
    PERSON_NOT_FOUND = "person.not_found"
    BILL_NOT_FOUND = "bill.not_found"
    ACT_NOT_FOUND = "act.not_found"
    SITEMAP_NOT_FOUND = "sitemap.not_found"
    SEARCH_TIMED_OUT = "search.timed_out"
    SEARCH_FILTER_REQUIRED = "search.filter_required"
    SEARCH_BUSY = "search.busy"
    SEARCH_EXCLUDED_WORDS_ONLY = "search.excluded_words_only"
    SEARCH_TOO_MANY_ALTERNATIVES = "search.too_many_alternatives"
    SEARCH_CONSTITUENCY_NOT_FOUND = "search.constituency_not_found"
    SEAT_CONSTITUENCY_NOT_FOUND = "seat.constituency_not_found"
    ENDPOINT_NOT_FOUND = "endpoint.not_found"
    OFFICE_MINISTRY_NOT_FOUND = "office.ministry_not_found"
    OFFICE_MEMBERSHIP_NOT_FOUND = "office.membership_not_found"
    DIVISION_NOT_FOUND = "division.not_found"


@dataclass(frozen=True, slots=True)
class ErrorSpec:
    status_code: int
    message: str


class ErrorDetail(TypedDict):
    error_code: ErrorCode
    message: str


ERRORS: Final[Mapping[ErrorCode, ErrorSpec]] = {
    ErrorCode.REPORT_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Report not found."
    ),
    ErrorCode.REPORT_TAKEN_DOWN: ErrorSpec(status.HTTP_410_GONE, "Report taken down."),
    ErrorCode.SITTING_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Sitting not found."
    ),
    ErrorCode.PERSON_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Person not found."
    ),
    ErrorCode.BILL_NOT_FOUND: ErrorSpec(status.HTTP_404_NOT_FOUND, "Bill not found."),
    ErrorCode.ACT_NOT_FOUND: ErrorSpec(status.HTTP_404_NOT_FOUND, "Act not found."),
    ErrorCode.SITEMAP_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Sitemap not found."
    ),
    ErrorCode.SEARCH_TIMED_OUT: ErrorSpec(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "The search took too long and was stopped.",
    ),
    ErrorCode.SEARCH_FILTER_REQUIRED: ErrorSpec(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        "The search has no words and no filter.",
    ),
    ErrorCode.SEARCH_BUSY: ErrorSpec(
        status.HTTP_429_TOO_MANY_REQUESTS,
        "Search is busy. Try again in a moment.",
    ),
    ErrorCode.SEARCH_EXCLUDED_WORDS_ONLY: ErrorSpec(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        "The search has only excluded words.",
    ),
    ErrorCode.SEARCH_TOO_MANY_ALTERNATIVES: ErrorSpec(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        "The search has too many alternatives.",
    ),
    ErrorCode.SEARCH_CONSTITUENCY_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Constituency not found."
    ),
    ErrorCode.SEAT_CONSTITUENCY_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Constituency not found."
    ),
    ErrorCode.ENDPOINT_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Endpoint not found."
    ),
    ErrorCode.OFFICE_MINISTRY_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Ministry not found."
    ),
    ErrorCode.OFFICE_MEMBERSHIP_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Membership not found."
    ),
    ErrorCode.DIVISION_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Division not found."
    ),
}


class AppHttpExceptionBase(HTTPException):
    def __init__(self, error_code: ErrorCode):
        error_spec = ERRORS[error_code]
        detail: ErrorDetail = ErrorDetail(
            error_code=error_code, message=error_spec.message
        )
        super().__init__(status_code=error_spec.status_code, detail=detail)
        self.error_code: ErrorCode = error_code
        self.error_message: str = error_spec.message

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
    SITEMAP_NOT_FOUND = "sitemap.not_found"
    SEARCH_TIMED_OUT = "search.timed_out"
    SEARCH_FILTER_REQUIRED = "search.filter_required"
    SEARCH_BUSY = "search.busy"
    SEARCH_EXCLUDED_WORDS_ONLY = "search.excluded_words_only"


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

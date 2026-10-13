from dataclasses import dataclass
from enum import StrEnum, unique
from typing import Final, Mapping, TypedDict

from fastapi import HTTPException, status


@unique
class ErrorCode(StrEnum):
    REPORT_NOT_FOUND = "report.not_found"
    SITTING_NOT_FOUND = "sitting.not_found"
    PERSON_NOT_FOUND = "person.not_found"
    SEARCH_TIMED_OUT = "search.timed_out"


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
    ErrorCode.SITTING_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Sitting not found."
    ),
    ErrorCode.PERSON_NOT_FOUND: ErrorSpec(
        status.HTTP_404_NOT_FOUND, "Person not found."
    ),
    ErrorCode.SEARCH_TIMED_OUT: ErrorSpec(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "The search took too long and was stopped.",
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

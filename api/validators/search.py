from datetime import date
from typing import Optional

from enums import ReportType
from exceptions.search import (
    SearchExcludedWordsOnlyException,
    SearchFilterRequiredException,
)
from utils.search_query import is_query_only_excluded_words


def validate_can_search_speeches(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    person_id: Optional[int],
) -> None:
    if (
        query.strip() == ""
        and parliament_number is None
        and date_from is None
        and date_to is None
        and report_type is None
        and person_id is None
    ):
        raise SearchFilterRequiredException
    if is_query_only_excluded_words(query):
        raise SearchExcludedWordsOnlyException


def validate_can_search_reports(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
) -> None:
    if (
        query.strip() == ""
        and parliament_number is None
        and date_from is None
        and date_to is None
        and report_type is None
        and is_text_available is None
    ):
        raise SearchFilterRequiredException
    if is_query_only_excluded_words(query):
        raise SearchExcludedWordsOnlyException

from datetime import date
from typing import Optional

from enums import ReportType
from exceptions.search import (
    SearchExcludedWordsOnlyException,
    SearchFilterRequiredException,
    SearchTooManyAlternativesException,
)
from utils.search_query import (
    get_search_query_group_count,
    is_query_only_excluded_words,
)

# NOTE: brackets multiply OR groups, and a query with quotes checks each group row by row; on the replica, quoted phrases in 16 groups took 4 seconds and in 32 groups 12 to 16, past the 10-second limit
MAX_SEARCH_QUERY_GROUP_COUNT = 16


def validate_can_search_speeches(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    person_id: Optional[int],
    constituency: Optional[str],
    act_sso_code: Optional[str],
) -> None:
    if (
        query.strip() == ""
        and parliament_number is None
        and date_from is None
        and date_to is None
        and report_type is None
        and person_id is None
        and constituency is None
        and act_sso_code is None
    ):
        raise SearchFilterRequiredException
    if get_search_query_group_count(query) > MAX_SEARCH_QUERY_GROUP_COUNT:
        raise SearchTooManyAlternativesException
    if (
        is_query_only_excluded_words(query)
        and person_id is None
        and constituency is None
    ):
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
    if get_search_query_group_count(query) > MAX_SEARCH_QUERY_GROUP_COUNT:
        raise SearchTooManyAlternativesException
    if is_query_only_excluded_words(query):
        raise SearchExcludedWordsOnlyException


def validate_can_get_report_matched_words(words: str) -> None:
    if get_search_query_group_count(words) > MAX_SEARCH_QUERY_GROUP_COUNT:
        raise SearchTooManyAlternativesException

from collections import Counter
from datetime import date, datetime, timezone
from threading import Lock

from enums import SearchEndpoint
from schemas.search_count import GetSearchCountsResponse, SearchCountData
from utils.singapore_date import get_singapore_date

_MAX_COUNTED_KEYS = 10_000

_CountKey = tuple[date, SearchEndpoint]

_counted_since = datetime.now(timezone.utc)
_count_key_lock = Lock()
_count_key_to_search_count: Counter[_CountKey] = Counter()
_count_key_to_refusal_count: Counter[_CountKey] = Counter()


def _add_count(
    count_key_to_count: Counter[_CountKey],
    search_endpoint: SearchEndpoint,
) -> None:
    count_key = (get_singapore_date(datetime.now(timezone.utc)), search_endpoint)
    with _count_key_lock:
        if count_key in count_key_to_count:
            count_key_to_count[count_key] += 1
            return
        if len(count_key_to_count) >= _MAX_COUNTED_KEYS:
            return
        count_key_to_count[count_key] = 1


def count_search(search_endpoint: SearchEndpoint) -> None:
    _add_count(_count_key_to_search_count, search_endpoint)


def count_search_refusal(search_endpoint: SearchEndpoint) -> None:
    _add_count(_count_key_to_refusal_count, search_endpoint)


def get_search_counts() -> GetSearchCountsResponse:
    with _count_key_lock:
        count_key_to_search_count = Counter(_count_key_to_search_count)
        count_key_to_refusal_count = Counter(_count_key_to_refusal_count)
    counts = [
        SearchCountData(
            counted_on=counted_on,
            endpoint=search_endpoint,
            search_count=count_key_to_search_count[(counted_on, search_endpoint)],
            refusal_count=count_key_to_refusal_count[(counted_on, search_endpoint)],
        )
        for counted_on, search_endpoint in sorted(
            count_key_to_search_count.keys() | count_key_to_refusal_count.keys()
        )
    ]
    return GetSearchCountsResponse(counted_since=_counted_since, counts=counts)

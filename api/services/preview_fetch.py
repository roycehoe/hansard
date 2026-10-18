from collections import Counter
from datetime import date, datetime, timezone
from threading import Lock

from schemas.preview_fetch import GetPreviewFetchesResponse, PreviewFetchData
from utils.singapore_date import get_singapore_date

_MAX_COUNTED_KEYS = 10_000

_counted_since = datetime.now(timezone.utc)
_fetch_key_to_count_lock = Lock()
# NOTE: written on the event loop and read in the thread pool, so every access holds the lock
_fetch_key_to_count: Counter[tuple[date, str, str]] = Counter()


def count_preview_fetch(bot_name: str, path: str) -> None:
    fetch_key = (get_singapore_date(datetime.now(timezone.utc)), bot_name, path)
    with _fetch_key_to_count_lock:
        if (
            fetch_key not in _fetch_key_to_count
            and len(_fetch_key_to_count) >= _MAX_COUNTED_KEYS
        ):
            return
        _fetch_key_to_count[fetch_key] += 1


def get_preview_fetches() -> GetPreviewFetchesResponse:
    with _fetch_key_to_count_lock:
        fetch_key_to_count = dict(_fetch_key_to_count)
    fetches = [
        PreviewFetchData(
            fetched_on=fetched_on, bot_name=bot_name, path=path, fetch_count=fetch_count
        )
        for (fetched_on, bot_name, path), fetch_count in sorted(
            fetch_key_to_count.items()
        )
    ]
    return GetPreviewFetchesResponse(counted_since=_counted_since, fetches=fetches)

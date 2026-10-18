import re
from collections import Counter
from datetime import date, datetime, timezone
from threading import Lock

from schemas.preview_fetch import GetPreviewFetchesResponse, PreviewFetchData
from utils.singapore_date import get_singapore_date

_MAX_COUNTED_KEYS = 10_000
_MAX_COUNTED_PATH_BYTES = 1_000_000
_MAX_PATH_BYTES = 300
_OTHER_PATH = "other"
_PATH_ENCODING = "utf-8"
_SITE_PATH = re.compile(
    r"/"
    r"|/coverage|/coverage/methods|/search|/researchers|/design|/palette"
    r"|/people|/people/\d+(?:-[^/]*)?"
    r"|/sittings|/sittings/\d{4}-\d{2}-\d{2}"
    r"|/reports/[^/]+"
)

_counted_since = datetime.now(timezone.utc)
_fetch_key_to_count_lock = Lock()
# NOTE: written on the event loop and read in the thread pool, so every access holds the lock
_fetch_key_to_count: Counter[tuple[date, str, str]] = Counter()
_counted_path_bytes = 0


def _get_counted_path(path: str) -> str:
    if len(path.encode(_PATH_ENCODING)) > _MAX_PATH_BYTES:
        return _OTHER_PATH
    if _SITE_PATH.fullmatch(path) is None:
        return _OTHER_PATH
    return path


def count_preview_fetch(bot_name: str, path: str) -> None:
    global _counted_path_bytes
    counted_path = _get_counted_path(path)
    counted_path_bytes = len(counted_path.encode(_PATH_ENCODING))
    fetch_key = (get_singapore_date(datetime.now(timezone.utc)), bot_name, counted_path)
    with _fetch_key_to_count_lock:
        if fetch_key in _fetch_key_to_count:
            _fetch_key_to_count[fetch_key] += 1
            return
        if len(_fetch_key_to_count) >= _MAX_COUNTED_KEYS:
            return
        if _counted_path_bytes + counted_path_bytes > _MAX_COUNTED_PATH_BYTES:
            return
        _fetch_key_to_count[fetch_key] = 1
        _counted_path_bytes += counted_path_bytes


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

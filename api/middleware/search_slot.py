from collections.abc import Generator
from contextlib import contextmanager
from threading import BoundedSemaphore

from psycopg.errors import QueryCanceled
from sqlalchemy.exc import OperationalError

from enums import SearchEndpoint
from exceptions.search import SearchBusyException, SearchTimedOutException
from services.search_count import count_search, count_search_refusal

_MAX_RUNNING_SEARCHES = 3

_search_slots = BoundedSemaphore(_MAX_RUNNING_SEARCHES)


@contextmanager
def hold_search_slot(search_endpoint: SearchEndpoint) -> Generator[None, None, None]:
    count_search(search_endpoint)
    if not _search_slots.acquire(blocking=False):
        count_search_refusal(search_endpoint)
        raise SearchBusyException
    try:
        yield
    except OperationalError as error:
        if isinstance(error.orig, QueryCanceled):
            raise SearchTimedOutException
        raise
    finally:
        _search_slots.release()

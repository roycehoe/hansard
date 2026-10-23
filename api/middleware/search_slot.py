from collections.abc import Generator
from contextlib import contextmanager
from threading import BoundedSemaphore

from psycopg.errors import QueryCanceled
from sqlalchemy.exc import OperationalError

from exceptions.search import SearchBusyException, SearchTimedOutException

_MAX_RUNNING_SEARCHES = 3

_search_slots = BoundedSemaphore(_MAX_RUNNING_SEARCHES)


@contextmanager
def hold_search_slot() -> Generator[None, None, None]:
    if not _search_slots.acquire(blocking=False):
        raise SearchBusyException
    try:
        yield
    except OperationalError as error:
        if isinstance(error.orig, QueryCanceled):
            raise SearchTimedOutException
        raise
    finally:
        _search_slots.release()

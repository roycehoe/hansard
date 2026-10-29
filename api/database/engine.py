from collections.abc import Generator

from sqlmodel import Session, create_engine

from settings import settings

_READ_ONLY_OPTION = "-c default_transaction_read_only=on"
_STATEMENT_TIMEOUT_MILLISECONDS = 30_000
_CONNECTION_OPTIONS = (
    f"{_READ_ONLY_OPTION} -c statement_timeout={_STATEMENT_TIMEOUT_MILLISECONDS}"
)
_SEARCH_STATEMENT_TIMEOUT_MILLISECONDS = 10_000
# NOTE: off, so a capped count's sequential scan of speech always starts at block 0; on, it starts where the last LIMIT-cut scan stopped, so each run reads pages no earlier run cached
_UNSYNCHRONIZED_SEQUENTIAL_SCANS_OPTION = "-c synchronize_seqscans=off"
# NOTE: no parallel workers, because the database has one shared vCPU, where workers take turns with their leader, and every search plan that chose them ran faster without them even on eight cores
_NO_PARALLEL_WORKERS_OPTION = "-c max_parallel_workers_per_gather=0"
_SEARCH_CONNECTION_OPTIONS = (
    f"{_READ_ONLY_OPTION} -c statement_timeout={_SEARCH_STATEMENT_TIMEOUT_MILLISECONDS}"
    f" {_UNSYNCHRONIZED_SEQUENTIAL_SCANS_OPTION} {_NO_PARALLEL_WORKERS_OPTION}"
)
_POOL_SIZE = 5
_MAX_OVERFLOW = 5
_SEARCH_POOL_SIZE = 3
_SEARCH_MAX_OVERFLOW = 2

engine = create_engine(
    settings.database_url,
    connect_args={"options": _CONNECTION_OPTIONS},
    pool_size=_POOL_SIZE,
    max_overflow=_MAX_OVERFLOW,
    pool_pre_ping=True,
)

search_engine = create_engine(
    settings.database_url,
    connect_args={"options": _SEARCH_CONNECTION_OPTIONS},
    pool_size=_SEARCH_POOL_SIZE,
    max_overflow=_SEARCH_MAX_OVERFLOW,
    pool_pre_ping=True,
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def get_search_session() -> Generator[Session, None, None]:
    with Session(search_engine) as session:
        yield session

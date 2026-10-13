from collections.abc import Generator

from sqlmodel import Session, create_engine

from settings import settings

_STATEMENT_TIMEOUT_MILLISECONDS = 30_000
_CONNECTION_OPTIONS = f"-c default_transaction_read_only=on -c statement_timeout={_STATEMENT_TIMEOUT_MILLISECONDS}"

engine = create_engine(
    settings.database_url,
    connect_args={"options": _CONNECTION_OPTIONS},
    pool_pre_ping=True,
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

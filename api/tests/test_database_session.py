from collections.abc import Callable, Generator
from contextlib import contextmanager

import pytest
from psycopg.errors import ReadOnlySqlTransaction
from sqlalchemy.exc import InternalError
from sqlmodel import Session, text

from database.engine import engine, get_search_session, get_session

pytestmark = pytest.mark.database


def test_the_default_connection_refuses_a_write() -> None:
    with Session(engine) as session:
        with pytest.raises(InternalError) as raised_error:
            session.exec(text("UPDATE report SET title = title WHERE false"))

    assert isinstance(raised_error.value.orig, ReadOnlySqlTransaction)


def test_the_search_connection_refuses_a_write() -> None:
    with contextmanager(get_search_session)() as session:
        with pytest.raises(InternalError) as raised_error:
            session.exec(text("UPDATE report SET title = title WHERE false"))

    assert isinstance(raised_error.value.orig, ReadOnlySqlTransaction)


@pytest.mark.parametrize(
    ("get_session_dependency", "expected_timeout"),
    [(get_session, "30s"), (get_search_session, "10s")],
)
def test_each_session_has_its_statement_timeout(
    get_session_dependency: Callable[[], Generator[Session, None, None]],
    expected_timeout: str,
) -> None:
    with contextmanager(get_session_dependency)() as session:
        statement_timeout = session.exec(text("SHOW statement_timeout")).scalar_one()

    assert statement_timeout == expected_timeout

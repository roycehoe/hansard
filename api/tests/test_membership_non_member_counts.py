from collections.abc import Iterator

import pytest
from sqlmodel import Session, SQLModel, create_engine

from crud.membership import CRUDMembership
from database.speaker import Speaker


@pytest.fixture
def session() -> Iterator[Session]:
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine, tables=[Speaker.__table__])  # type: ignore[attr-defined]
    with Session(engine) as session:
        yield session


def _add_speaker(
    session: Session, speaker_id: int, person_id: int | None, is_member: bool
) -> None:
    session.add(
        Speaker(
            id=speaker_id,
            name="A",
            party="",
            parliament_number=1,
            is_legislative_assembly=False,
            is_member=is_member,
            person_id=person_id,
        )
    )


def test_non_member_counts_separate_rows_from_never_member_persons(
    session: Session,
) -> None:
    _add_speaker(session, 1, 10, False)
    _add_speaker(session, 2, 10, False)
    _add_speaker(session, 3, 11, False)
    _add_speaker(session, 4, 11, True)
    _add_speaker(session, 5, 12, True)
    _add_speaker(session, 6, None, True)
    session.commit()

    membership = CRUDMembership(session)

    assert membership.get_non_member_count() == 3
    assert membership.get_never_member_person_count() == 1

from unittest.mock import MagicMock

import pytest
from psycopg.errors import InsufficientPrivilege, UndefinedTable
from sqlalchemy.exc import ProgrammingError

from services import coverage as coverage_service


@pytest.mark.parametrize("error_class", [InsufficientPrivilege, UndefinedTable])
def test_a_missing_refresh_run_grant_or_table_leaves_attribution_null(
    monkeypatch: pytest.MonkeyPatch, error_class: type[Exception]
) -> None:
    read = MagicMock(
        side_effect=ProgrammingError("SELECT refresh_run", {}, error_class())
    )
    monkeypatch.setattr(
        coverage_service.CRUDRefreshRun, "get_latest_by_status_and_figures_type", read
    )

    assert coverage_service._get_attribution(MagicMock()) is None
    read.assert_called_once()


def test_another_programming_error_still_raises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        coverage_service.CRUDRefreshRun,
        "get_latest_by_status_and_figures_type",
        MagicMock(side_effect=ProgrammingError("SELECT", {}, Exception("syntax"))),
    )

    with pytest.raises(ProgrammingError):
        coverage_service._get_attribution(MagicMock())

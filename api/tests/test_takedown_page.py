from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.requests import Request
from starlette.responses import PlainTextResponse, Response
from starlette.routing import Route

from middleware import takedown

_HIDDEN_REPORT_SLUG = "written-answer-11589"
_SHOWN_REPORT_SLUG = "written-answer-11590"


async def _get_page(request: Request) -> Response:
    return PlainTextResponse("page")


@pytest.fixture
def page_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    (tmp_path / "index.html").write_text("<html></html>")
    monkeypatch.setattr(
        takedown, "_TAKEN_DOWN_REPORT_SLUGS", frozenset({_HIDDEN_REPORT_SLUG})
    )
    return TestClient(
        Starlette(
            routes=[Route("/{path:path}", _get_page)],
            middleware=[
                Middleware(takedown.TakedownMiddleware, frontend_dist_path=tmp_path)
            ],
        )
    )


@pytest.mark.parametrize(
    "path",
    [
        f"/reports/{_HIDDEN_REPORT_SLUG}",
        f"/reports/{_HIDDEN_REPORT_SLUG}/",
        f"/reports//{_HIDDEN_REPORT_SLUG}",
        f"/reports/./{_HIDDEN_REPORT_SLUG}",
        f"/x/../reports/{_HIDDEN_REPORT_SLUG}",
        f"/reports/{_HIDDEN_REPORT_SLUG}%23",
        f"/reports/{_HIDDEN_REPORT_SLUG}%2523",
        f"/Reports/{_HIDDEN_REPORT_SLUG}",
        f"/REPORTS/{_HIDDEN_REPORT_SLUG}",
        f"/reports/{_HIDDEN_REPORT_SLUG}?s=2&q=the+latest+estimates",
        f"/Reports/{_HIDDEN_REPORT_SLUG}?s=2&q=the+latest+estimates",
        f"/reports/{_HIDDEN_REPORT_SLUG.upper()}",
        f"/reports/{_HIDDEN_REPORT_SLUG}%20",
        f"/reports/{_HIDDEN_REPORT_SLUG}%00",
        f"/reports/%20{_HIDDEN_REPORT_SLUG}%09",
    ],
)
def test_every_spelling_of_a_hidden_report_page_answers_410(
    page_client: TestClient, path: str
) -> None:
    response = page_client.get(path)

    assert response.status_code == status.HTTP_410_GONE


@pytest.mark.parametrize(
    "path",
    [f"/reports/{_SHOWN_REPORT_SLUG}", f"/Reports/{_SHOWN_REPORT_SLUG}", "/coverage"],
)
def test_a_page_that_is_not_hidden_answers_200(
    page_client: TestClient, path: str
) -> None:
    response = page_client.get(path)

    assert response.status_code == status.HTTP_200_OK

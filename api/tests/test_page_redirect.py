import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.requests import Request
from starlette.responses import PlainTextResponse, Response
from starlette.routing import Route

from middleware.page_redirect import PageRedirectMiddleware


async def _get_page(request: Request) -> Response:
    return PlainTextResponse("page")


@pytest.fixture
def page_client() -> TestClient:
    return TestClient(
        Starlette(
            routes=[Route("/{path:path}", _get_page)],
            middleware=[Middleware(PageRedirectMiddleware)],
        ),
        follow_redirects=False,
    )


@pytest.mark.parametrize(
    ("path", "moved_path"),
    [
        ("/how-parliament-works", "/about/how-parliament-works"),
        ("/coverage", "/about/coverage"),
        ("/coverage/methods", "/about/coverage/methods"),
        ("/palette", "/about/palette"),
        ("/how-parliament-works/", "/about/how-parliament-works"),
        ("/coverage/", "/about/coverage"),
        ("/coverage/methods/", "/about/coverage/methods"),
        ("/palette/", "/about/palette"),
    ],
)
def test_an_old_page_path_answers_a_permanent_redirect_to_its_about_path(
    page_client: TestClient, path: str, moved_path: str
) -> None:
    response = page_client.get(path)

    assert response.status_code == status.HTTP_301_MOVED_PERMANENTLY
    assert response.headers["location"] == moved_path


def test_the_redirect_keeps_the_query_string(page_client: TestClient) -> None:
    response = page_client.get("/coverage/methods?ref=mail&q=carbon+tax%26levy")

    assert response.status_code == status.HTTP_301_MOVED_PERMANENTLY
    assert response.headers["location"] == (
        "/about/coverage/methods?ref=mail&q=carbon+tax%26levy"
    )


@pytest.mark.parametrize(
    "path",
    [
        "/",
        "/api/coverage",
        "/about/coverage",
        "/about/coverage/methods",
        "/coverage/methods/terms",
        "/coverages",
        "/palette-photos/chamber.jpg",
        "/reports/coverage",
    ],
)
def test_a_path_that_is_not_an_old_page_path_is_not_redirected(
    page_client: TestClient, path: str
) -> None:
    response = page_client.get(path)

    assert response.status_code == status.HTTP_200_OK


def test_the_website_redirects_an_old_page_path(website_client: TestClient) -> None:
    response = website_client.get("/coverage?ref=mail", follow_redirects=False)

    assert response.status_code == status.HTTP_301_MOVED_PERMANENTLY
    assert response.headers["location"] == "/about/coverage?ref=mail"

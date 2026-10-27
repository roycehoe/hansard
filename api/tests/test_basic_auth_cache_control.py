from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Route

from middleware.basic_auth import BasicAuthMiddleware

_USERNAME = "reader"
_PASSWORD = "secret"


async def _get_public(request: Request) -> Response:
    return Response("body", headers={"Cache-Control": "public, max-age=3600"})


async def _get_plain(request: Request) -> Response:
    return Response("body")


_stub_app = Starlette(
    routes=[
        Route("/public", _get_public),
        Route("/plain", _get_plain),
        Route("/api/health", _get_public),
    ],
    middleware=[
        Middleware(BasicAuthMiddleware, username=_USERNAME, password=_PASSWORD)
    ],
)


def test_authorised_public_response_becomes_private() -> None:
    response = TestClient(_stub_app).get("/public", auth=(_USERNAME, _PASSWORD))

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "private, max-age=3600"
    assert response.headers["x-robots-tag"] == "noindex"


def test_authorised_response_without_cache_control_gets_none() -> None:
    response = TestClient(_stub_app).get("/plain", auth=(_USERNAME, _PASSWORD))

    assert response.status_code == status.HTTP_200_OK
    assert "cache-control" not in response.headers


def test_the_open_health_path_is_made_private_too() -> None:
    response = TestClient(_stub_app).get("/api/health")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "private, max-age=3600"


def test_unauthorised_request_gets_a_401_with_no_cache_control() -> None:
    response = TestClient(_stub_app).get("/public")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "cache-control" not in response.headers
    assert response.headers["www-authenticate"] == 'Basic realm="Open Hansard"'
    assert response.headers["x-robots-tag"] == "noindex"

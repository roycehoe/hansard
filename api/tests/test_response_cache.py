from collections import Counter

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route

from middleware import response_cache

_path_to_call_count: Counter[str] = Counter()


async def _get_ok(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"ok": True})


async def _get_missing(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"detail": "missing"}, status_code=status.HTTP_404_NOT_FOUND)


async def _get_excluded(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"ok": True})


async def _get_large(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return Response(b"x" * (response_cache._CACHE_MAX_BODY_BYTES + 1))


_stub_app = Starlette(
    routes=[
        Route("/ok", _get_ok),
        Route("/large", _get_large),
        Route("/missing", _get_missing),
        Route("/health", _get_excluded),
        Route("/preview-fetches", _get_excluded),
    ],
    middleware=[Middleware(response_cache.ResponseCacheMiddleware)],
)
_parent_app = Starlette(
    routes=[Mount("/api", app=_stub_app), Mount("/", app=_stub_app)]
)


class _FakeClock:
    def __init__(self):
        self.now = 1_000.0

    def __call__(self) -> float:
        return self.now


@pytest.fixture
def stub_client() -> TestClient:
    _path_to_call_count.clear()
    return TestClient(_parent_app)


@pytest.fixture
def clock(monkeypatch: pytest.MonkeyPatch) -> _FakeClock:
    fake_clock = _FakeClock()
    monkeypatch.setattr(response_cache, "monotonic", fake_clock)
    return fake_clock


def test_cache_serves_the_second_get_from_memory(stub_client: TestClient) -> None:
    first = stub_client.get("/ok", params={"page": 1})
    second = stub_client.get("/ok", params={"page": 1})

    assert _path_to_call_count["/ok"] == 1
    assert second.status_code == status.HTTP_200_OK
    assert second.content == first.content
    assert first.headers["cache-control"] == "public, max-age=3600"
    assert second.headers["cache-control"] == "public, max-age=3600"


def test_cache_keys_on_query_string_and_gzip(stub_client: TestClient) -> None:
    stub_client.get("/ok", params={"page": 1})
    stub_client.get("/ok", params={"page": 2})
    stub_client.get("/ok", params={"page": 1}, headers={"Accept-Encoding": "identity"})

    assert _path_to_call_count["/ok"] == 3


def test_cache_labels_and_stores_only_a_200(stub_client: TestClient) -> None:
    first = stub_client.get("/missing")
    second = stub_client.get("/missing")

    assert first.status_code == status.HTTP_404_NOT_FOUND
    assert "cache-control" not in first.headers
    assert "cache-control" not in second.headers
    assert _path_to_call_count["/missing"] == 2


@pytest.mark.parametrize("prefix", ["", "/api"])
def test_cache_drops_the_oldest_entry_past_the_cap(
    stub_client: TestClient, prefix: str
) -> None:
    cap = response_cache._CACHE_MAX_ENTRIES
    for number in range(cap + 1):
        stub_client.get(f"{prefix}/ok", params={"number": number})
    assert _path_to_call_count[f"{prefix}/ok"] == cap + 1

    stub_client.get(f"{prefix}/ok", params={"number": cap})
    assert _path_to_call_count[f"{prefix}/ok"] == cap + 1

    stub_client.get(f"{prefix}/ok", params={"number": 0})
    assert _path_to_call_count[f"{prefix}/ok"] == cap + 2
    assert len(response_cache._cache_key_to_cached_response) == cap


def test_cache_entry_expires_after_an_hour(
    stub_client: TestClient, clock: _FakeClock
) -> None:
    stub_client.get("/ok")
    clock.now += response_cache._CACHE_TTL_SECONDS - 1
    stub_client.get("/ok")
    assert _path_to_call_count["/ok"] == 1

    clock.now += 1
    stub_client.get("/ok")
    assert _path_to_call_count["/ok"] == 2


@pytest.mark.parametrize("prefix", ["", "/api"])
@pytest.mark.parametrize("route_path", ["/health", "/preview-fetches"])
def test_cache_never_stores_an_excluded_path(
    stub_client: TestClient, prefix: str, route_path: str
) -> None:
    first = stub_client.get(f"{prefix}{route_path}")
    second = stub_client.get(f"{prefix}{route_path}")

    assert _path_to_call_count[f"{prefix}{route_path}"] == 2
    assert "cache-control" not in first.headers
    assert "cache-control" not in second.headers
    assert len(response_cache._cache_key_to_cached_response) == 0


def test_cache_does_not_store_a_body_over_the_size_cap(stub_client: TestClient) -> None:
    first = stub_client.get("/large", headers={"Accept-Encoding": "identity"})
    stub_client.get("/large", headers={"Accept-Encoding": "identity"})

    assert first.status_code == status.HTTP_200_OK
    assert first.headers["cache-control"] == "public, max-age=3600"
    assert _path_to_call_count["/large"] == 2
    assert len(response_cache._cache_key_to_cached_response) == 0

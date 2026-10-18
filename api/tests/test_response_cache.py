from collections import Counter
from typing import Optional

import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount

from middleware import response_cache

_path_to_call_count: Counter[str] = Counter()

_stub_app = FastAPI()
_stub_app.add_middleware(response_cache.ResponseCacheMiddleware)


@_stub_app.get("/ok")
def _get_ok(
    request: Request, page: Optional[int] = None, number: Optional[int] = None
) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"ok": True})


@_stub_app.get("/large")
def _get_large(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return Response(b"x" * (response_cache._CACHE_MAX_BODY_BYTES + 1))


@_stub_app.get("/sized/{size}")
def _get_sized(request: Request, size: int) -> Response:
    _path_to_call_count[request.url.path] += 1
    return Response(b"x" * size)


@_stub_app.get("/unlisted", include_in_schema=False)
def _get_unlisted(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"ok": True})


@_stub_app.get("/missing")
def _get_missing(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"detail": "missing"}, status_code=status.HTTP_404_NOT_FOUND)


@_stub_app.get("/health")
def _get_health(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"ok": True})


@_stub_app.get("/preview-fetches")
def _get_preview_fetches(request: Request) -> Response:
    _path_to_call_count[request.url.path] += 1
    return JSONResponse({"ok": True})


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


def test_cache_ignores_query_parameters_the_route_does_not_declare(
    stub_client: TestClient,
) -> None:
    for number in range(20):
        stub_client.get("/ok", params={"page": 1, "junk": number})
    stub_client.get("/ok?junk=x&page=1&other=y")

    assert _path_to_call_count["/ok"] == 1
    assert len(response_cache._cache_key_to_cached_response) == 1


def test_cache_keys_on_declared_parameters_in_any_order(
    stub_client: TestClient,
) -> None:
    stub_client.get("/ok?page=1&number=2")
    stub_client.get("/ok?number=2&page=1")

    assert _path_to_call_count["/ok"] == 1


def test_cache_does_not_store_a_path_with_no_declared_route(
    stub_client: TestClient,
) -> None:
    first = stub_client.get("/unlisted")
    stub_client.get("/unlisted")

    assert first.status_code == status.HTTP_200_OK
    assert _path_to_call_count["/unlisted"] == 2
    assert len(response_cache._cache_key_to_cached_response) == 0


def test_cache_drops_the_oldest_entries_past_the_byte_budget(
    stub_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(response_cache, "_CACHE_MAX_TOTAL_BYTES", 1_000)
    for size in [400, 401, 402, 403]:
        stub_client.get(f"/sized/{size}", headers={"Accept-Encoding": "identity"})

    cached_paths = [
        route_path for route_path, _, _ in response_cache._cache_key_to_cached_response
    ]
    assert cached_paths == ["/sized/402", "/sized/403"]
    assert (
        sum(
            cached_response.byte_count
            for cached_response in response_cache._cache_key_to_cached_response.values()
        )
        <= 1_000
    )

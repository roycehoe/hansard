from dataclasses import dataclass
from time import monotonic
from typing import Optional

from fastapi import status
from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

_CACHE_TTL_SECONDS = 60 * 60
_CACHE_MAX_ENTRIES = 500
_CACHE_MAX_BODY_BYTES = 256 * 1024
_CACHE_CONTROL_HEADER = "Cache-Control"
_CACHE_CONTROL_VALUE = f"public, max-age={_CACHE_TTL_SECONDS}"
_ACCEPT_ENCODING_HEADER = "Accept-Encoding"
_GZIP_ENCODING = "gzip"
_HTTP_SCOPE_TYPE = "http"
_GET_METHOD = "GET"
_HEALTH_PATH = "/health"
_PREVIEW_FETCHES_PATH = "/preview-fetches"
_RESPONSE_START_TYPE = "http.response.start"
_RESPONSE_BODY_TYPE = "http.response.body"

_CacheKey = tuple[str, bytes, bool]
_RawHeaders = tuple[tuple[bytes, bytes], ...]


@dataclass(frozen=True)
class _CachedResponse:
    expires_at: float
    headers: _RawHeaders
    body: bytes


# NOTE: replaced whole and never mutated, so a request never reads a half-written entry
_cache_key_to_cached_response: dict[_CacheKey, _CachedResponse] = {}


def _get_route_path(scope: Scope) -> str:
    return scope["path"].removeprefix(scope.get("root_path", ""))


def _is_uncached_path(route_path: str) -> bool:
    return route_path == _HEALTH_PATH or route_path == _PREVIEW_FETCHES_PATH


def _is_gzip_accepted(scope: Scope) -> bool:
    return _GZIP_ENCODING in Headers(scope=scope).get(_ACCEPT_ENCODING_HEADER, "")


def _get_cache_with_response(
    cache_key: _CacheKey, headers: _RawHeaders, body: bytes
) -> dict[_CacheKey, _CachedResponse]:
    now = monotonic()
    live_entries = [
        (key, cached_response)
        for key, cached_response in _cache_key_to_cached_response.items()
        if now < cached_response.expires_at and key != cache_key
    ]
    kept_entries = live_entries[-(_CACHE_MAX_ENTRIES - 1) :]
    return {
        **dict(kept_entries),
        cache_key: _CachedResponse(now + _CACHE_TTL_SECONDS, headers, body),
    }


def _store_response(cache_key: _CacheKey, headers: _RawHeaders, body: bytes) -> None:
    global _cache_key_to_cached_response
    _cache_key_to_cached_response = _get_cache_with_response(cache_key, headers, body)


class _CachingSend:
    def __init__(self, send: Send, cache_key: _CacheKey):
        self.send = send
        self.cache_key = cache_key
        self.headers: Optional[_RawHeaders] = None
        self.body_chunks: list[bytes] = []

    async def __call__(self, message: Message) -> None:
        if (
            message["type"] == _RESPONSE_START_TYPE
            and message["status"] == status.HTTP_200_OK
        ):
            MutableHeaders(scope=message)[_CACHE_CONTROL_HEADER] = _CACHE_CONTROL_VALUE
            self.headers = tuple(message["headers"])
        await self.send(message)
        if message["type"] != _RESPONSE_BODY_TYPE or self.headers is None:
            return
        self.body_chunks.append(message.get("body", b""))
        if message.get("more_body", False):
            return
        body = b"".join(self.body_chunks)
        if len(body) > _CACHE_MAX_BODY_BYTES:
            return
        _store_response(self.cache_key, self.headers, body)


class ResponseCacheMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != _HTTP_SCOPE_TYPE or scope["method"] != _GET_METHOD:
            await self.app(scope, receive, send)
            return
        route_path = _get_route_path(scope)
        if _is_uncached_path(route_path):
            await self.app(scope, receive, send)
            return
        cache_key = (route_path, scope["query_string"], _is_gzip_accepted(scope))
        cached_response = _cache_key_to_cached_response.get(cache_key)
        if cached_response is not None and monotonic() < cached_response.expires_at:
            await send(
                {
                    "type": _RESPONSE_START_TYPE,
                    "status": status.HTTP_200_OK,
                    "headers": list(cached_response.headers),
                }
            )
            await send({"type": _RESPONSE_BODY_TYPE, "body": cached_response.body})
            return
        await self.app(scope, receive, _CachingSend(send, cache_key))

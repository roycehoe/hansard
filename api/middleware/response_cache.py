import re
from dataclasses import dataclass
from time import monotonic
from typing import Optional
from urllib.parse import parse_qsl

from fastapi import status
from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

_CACHE_TTL_SECONDS = 60 * 60
_CACHE_MAX_ENTRIES = 500
_CACHE_MAX_BODY_BYTES = 256 * 1024
_CACHE_MAX_TOTAL_BYTES = 32 * 1024 * 1024
_CACHE_CONTROL_HEADER = "Cache-Control"
_CACHE_CONTROL_VALUE = f"public, max-age={_CACHE_TTL_SECONDS}"
_ACCEPT_ENCODING_HEADER = "Accept-Encoding"
_GZIP_ENCODING = "gzip"
_HTTP_SCOPE_TYPE = "http"
_GET_METHOD = "GET"
_HEALTH_PATH = "/health"
_PREVIEW_FETCHES_PATH = "/preview-fetches"
_SEARCH_COUNTS_PATH = "/search-counts"
_RESPONSE_START_TYPE = "http.response.start"
_RESPONSE_BODY_TYPE = "http.response.body"
_GET_OPERATION = "get"
_QUERY_PARAMETER_LOCATION = "query"
_QUERY_STRING_ENCODING = "latin-1"
_PATH_PARAMETER = re.compile(r"\{[^}/]+\}")
_PATH_PARAMETER_VALUE = "[^/]+"

_QueryParameters = tuple[tuple[str, str], ...]
_CacheKey = tuple[str, _QueryParameters, bool]
_RawHeaders = tuple[tuple[bytes, bytes], ...]


@dataclass(frozen=True)
class _CachedResponse:
    expires_at: float
    headers: _RawHeaders
    body: bytes
    byte_count: int


@dataclass(frozen=True)
class _DeclaredRoute:
    path_pattern: re.Pattern[str]
    query_parameter_names: frozenset[str]


# NOTE: replaced whole and never mutated, so a request never reads a half-written entry
_cache_key_to_cached_response: dict[_CacheKey, _CachedResponse] = {}


def _get_route_path(scope: Scope) -> str:
    return scope["path"].removeprefix(scope.get("root_path", ""))


def _is_uncached_path(route_path: str) -> bool:
    return (
        route_path == _HEALTH_PATH
        or route_path == _PREVIEW_FETCHES_PATH
        or route_path == _SEARCH_COUNTS_PATH
    )


def _is_gzip_accepted(scope: Scope) -> bool:
    return _GZIP_ENCODING in Headers(scope=scope).get(_ACCEPT_ENCODING_HEADER, "")


def _get_path_pattern(path_template: str) -> re.Pattern[str]:
    fixed_parts = _PATH_PARAMETER.split(path_template)
    return re.compile(
        _PATH_PARAMETER_VALUE.join(re.escape(fixed_part) for fixed_part in fixed_parts)
    )


def _get_declared_routes(openapi_schema: dict) -> list[_DeclaredRoute]:
    return [
        _DeclaredRoute(
            _get_path_pattern(path_template),
            frozenset(
                parameter["name"]
                for parameter in path_item[_GET_OPERATION].get("parameters", [])
                if parameter["in"] == _QUERY_PARAMETER_LOCATION
            ),
        )
        for path_template, path_item in openapi_schema["paths"].items()
        if _GET_OPERATION in path_item
    ]


def _get_declared_query_parameters(
    query_string: bytes, query_parameter_names: frozenset[str]
) -> _QueryParameters:
    declared_query_parameters = [
        (name, value)
        for name, value in parse_qsl(
            query_string.decode(_QUERY_STRING_ENCODING), keep_blank_values=True
        )
        if name in query_parameter_names
    ]
    # NOTE: sorted by name only, so repeated values of one parameter keep their order
    return tuple(
        sorted(
            declared_query_parameters, key=lambda query_parameter: query_parameter[0]
        )
    )


def _get_entry_byte_count(cache_key: _CacheKey, body: bytes) -> int:
    route_path, query_parameters, _ = cache_key
    return (
        len(body)
        + len(route_path)
        + sum(len(name) + len(value) for name, value in query_parameters)
    )


def _get_cache_with_response(
    cache_key: _CacheKey, headers: _RawHeaders, body: bytes
) -> dict[_CacheKey, _CachedResponse]:
    now = monotonic()
    live_entries = [
        (key, cached_response)
        for key, cached_response in _cache_key_to_cached_response.items()
        if now < cached_response.expires_at and key != cache_key
    ]
    new_entry_byte_count = _get_entry_byte_count(cache_key, body)
    kept_byte_count = new_entry_byte_count
    kept_entries: list[tuple[_CacheKey, _CachedResponse]] = []
    for key, cached_response in reversed(live_entries):
        if len(kept_entries) == _CACHE_MAX_ENTRIES - 1:
            break
        if kept_byte_count + cached_response.byte_count > _CACHE_MAX_TOTAL_BYTES:
            break
        kept_entries.append((key, cached_response))
        kept_byte_count += cached_response.byte_count
    return {
        **dict(reversed(kept_entries)),
        cache_key: _CachedResponse(
            now + _CACHE_TTL_SECONDS, headers, body, new_entry_byte_count
        ),
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
        self.declared_routes: Optional[list[_DeclaredRoute]] = None

    def _get_query_parameter_names(
        self, scope: Scope, route_path: str
    ) -> Optional[frozenset[str]]:
        if self.declared_routes is None:
            self.declared_routes = _get_declared_routes(scope["app"].openapi())
        matching_routes = [
            declared_route
            for declared_route in self.declared_routes
            if declared_route.path_pattern.fullmatch(route_path) is not None
        ]
        if not matching_routes:
            return None
        return frozenset().union(
            *(
                declared_route.query_parameter_names
                for declared_route in matching_routes
            )
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != _HTTP_SCOPE_TYPE or scope["method"] != _GET_METHOD:
            await self.app(scope, receive, send)
            return
        route_path = _get_route_path(scope)
        if _is_uncached_path(route_path):
            await self.app(scope, receive, send)
            return
        query_parameter_names = self._get_query_parameter_names(scope, route_path)
        if query_parameter_names is None:
            await self.app(scope, receive, send)
            return
        cache_key = (
            route_path,
            _get_declared_query_parameters(
                scope["query_string"], query_parameter_names
            ),
            _is_gzip_accepted(scope),
        )
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

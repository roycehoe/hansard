import logging
from time import perf_counter
from typing import Optional

from fastapi import status
from starlette.types import ASGIApp, Message, Receive, Scope, Send

_SLOW_REQUEST_SECONDS = 3
_MILLISECONDS_PER_SECOND = 1_000
_HTTP_SCOPE_TYPE = "http"
_RESPONSE_START_TYPE = "http.response.start"
_QUERY_STRING_ENCODING = "latin-1"
_NO_ERROR = ""

logger = logging.getLogger(__name__)


def _should_log_request(status_code: int, duration_seconds: float) -> bool:
    return (
        status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        or status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        or duration_seconds > _SLOW_REQUEST_SECONDS
    )


def _log_request(
    scope: Scope, status_code: int, duration_seconds: float, error_name: str
) -> None:
    route = scope.get("route")
    log_level = (
        logging.ERROR
        if status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        else logging.WARNING
    )
    logger.log(
        log_level,
        "request method=%s route=%s path_params=%s query=%s status=%s duration_ms=%d error=%s",
        scope["method"],
        route.path if route is not None else scope["path"],
        scope.get("path_params", {}),
        scope["query_string"].decode(_QUERY_STRING_ENCODING),
        status_code,
        duration_seconds * _MILLISECONDS_PER_SECOND,
        error_name,
    )


class _StatusCapturingSend:
    def __init__(self, send: Send):
        self.send = send
        self.status_code: Optional[int] = None

    async def __call__(self, message: Message) -> None:
        if message["type"] == _RESPONSE_START_TYPE:
            self.status_code = message["status"]
        await self.send(message)


class RequestLogMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != _HTTP_SCOPE_TYPE:
            await self.app(scope, receive, send)
            return
        started_at = perf_counter()
        capturing_send = _StatusCapturingSend(send)
        try:
            await self.app(scope, receive, capturing_send)
        except Exception as error_to_record:
            _log_request(
                scope,
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                perf_counter() - started_at,
                type(error_to_record).__name__,
            )
            raise
        duration_seconds = perf_counter() - started_at
        if capturing_send.status_code is None:
            return
        if _should_log_request(capturing_send.status_code, duration_seconds):
            _log_request(scope, capturing_send.status_code, duration_seconds, _NO_ERROR)

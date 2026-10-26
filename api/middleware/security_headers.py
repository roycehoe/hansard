from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

_HTTP_SCOPE_TYPE = "http"
_RESPONSE_START_TYPE = "http.response.start"
_SECURITY_HEADERS = (
    ("Strict-Transport-Security", "max-age=31536000"),
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("Content-Security-Policy", "frame-ancestors 'none'"),
)


class _SecurityHeadersSend:
    def __init__(self, send: Send):
        self.send = send

    async def __call__(self, message: Message) -> None:
        if message["type"] == _RESPONSE_START_TYPE:
            headers = MutableHeaders(scope=message)
            for name, value in _SECURITY_HEADERS:
                headers[name] = value
        await self.send(message)


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != _HTTP_SCOPE_TYPE:
            await self.app(scope, receive, send)
            return
        await self.app(scope, receive, _SecurityHeadersSend(send))

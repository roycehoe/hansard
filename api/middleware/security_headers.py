import re

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

_HTTP_SCOPE_TYPE = "http"
_RESPONSE_START_TYPE = "http.response.start"
_PATH_KEY = "path"
_CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy"
# NOTE: the sha256 source is the inline theme script in app/index.html, and tests/test_security_headers.py recomputes it. style-src needs 'unsafe-inline' because Radix's scroll lock writes a <style> element whose contents change with the scrollbar width
_SHARED_CONTENT_SECURITY_POLICY_DIRECTIVES = (
    "default-src 'self'",
    "script-src 'self' 'sha256-v113e9zedJ1qRfpnuqczJ7xOkqPKWJmuhUiw9Rd9jNI=' https://gc.zgo.at",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://royceinbox.goatcounter.com",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
)
_CONTENT_SECURITY_POLICY = "; ".join(
    (*_SHARED_CONTENT_SECURITY_POLICY_DIRECTIVES, "frame-ancestors 'none'")
)
# NOTE: a paragraph embed is made to sit in a frame on any other site, so its route alone lifts frame-ancestors; the pattern matches only what routers/embed.py serves, never the app shell behind it
_EMBED_PATH = re.compile(r"^/embed/reports/[^/]+$")
_EMBED_CONTENT_SECURITY_POLICY = "; ".join(
    (*_SHARED_CONTENT_SECURITY_POLICY_DIRECTIVES, "frame-ancestors *")
)
_SECURITY_HEADERS = (
    ("Strict-Transport-Security", "max-age=31536000"),
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
)


def _get_content_security_policy(path: str) -> str:
    if _EMBED_PATH.match(path) is None:
        return _CONTENT_SECURITY_POLICY
    return _EMBED_CONTENT_SECURITY_POLICY


class _SecurityHeadersSend:
    def __init__(self, send: Send, content_security_policy: str):
        self.send = send
        self.content_security_policy = content_security_policy

    async def __call__(self, message: Message) -> None:
        if message["type"] == _RESPONSE_START_TYPE:
            headers = MutableHeaders(scope=message)
            for name, value in _SECURITY_HEADERS:
                headers[name] = value
            headers[_CONTENT_SECURITY_POLICY_HEADER] = self.content_security_policy
        await self.send(message)


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != _HTTP_SCOPE_TYPE:
            await self.app(scope, receive, send)
            return
        await self.app(
            scope,
            receive,
            _SecurityHeadersSend(send, _get_content_security_policy(scope[_PATH_KEY])),
        )

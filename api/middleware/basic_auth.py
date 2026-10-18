from base64 import b64encode
from secrets import compare_digest

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

_HEALTH_PATH = "/api/health"
_AUTHORIZATION_HEADER = "authorization"
_WWW_AUTHENTICATE_HEADER = "WWW-Authenticate"
_AUTHENTICATE_HEADER = 'Basic realm="Hansard"'
_ROBOTS_TAG_HEADER = "X-Robots-Tag"
_NOINDEX = "noindex"


class BasicAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, username: str, password: str):
        super().__init__(app)
        credentials = b64encode(f"{username}:{password}".encode()).decode()
        self.expected_authorization = f"Basic {credentials}".encode()

    async def _authenticate_request(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.url.path == _HEALTH_PATH:
            return await call_next(request)
        authorization = request.headers.get(_AUTHORIZATION_HEADER, "").encode()
        if compare_digest(authorization, self.expected_authorization):
            return await call_next(request)
        return Response(
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={_WWW_AUTHENTICATE_HEADER: _AUTHENTICATE_HEADER},
        )

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await self._authenticate_request(request, call_next)
        response.headers[_ROBOTS_TAG_HEADER] = _NOINDEX
        return response

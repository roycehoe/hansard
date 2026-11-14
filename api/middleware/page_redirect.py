from fastapi import status
from starlette.responses import RedirectResponse
from starlette.types import ASGIApp, Receive, Scope, Send

_HTTP_SCOPE_TYPE = "http"
_PATH_KEY = "path"
_QUERY_STRING_KEY = "query_string"
_QUERY_STRING_ENCODING = "latin-1"
_QUERY_SEPARATOR = "?"
_URL_SEPARATOR = "/"
_ABOUT_PATH = "/about"
_HOW_PARLIAMENT_WORKS_PATH = "/how-parliament-works"
_COVERAGE_PATH = "/coverage"
_METHODS_PATH = "/coverage/methods"
_PALETTE_PATH = "/palette"


def _is_page_moved_under_about(page_path: str) -> bool:
    return (
        page_path == _HOW_PARLIAMENT_WORKS_PATH
        or page_path == _COVERAGE_PATH
        or page_path == _METHODS_PATH
        or page_path == _PALETTE_PATH
    )


def _get_moved_page_url(page_path: str, query_string: bytes) -> str:
    moved_page_path = _ABOUT_PATH + page_path
    if not query_string:
        return moved_page_path
    return (
        moved_page_path + _QUERY_SEPARATOR + query_string.decode(_QUERY_STRING_ENCODING)
    )


class PageRedirectMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != _HTTP_SCOPE_TYPE:
            await self.app(scope, receive, send)
            return
        page_path = scope[_PATH_KEY].rstrip(_URL_SEPARATOR)
        if not _is_page_moved_under_about(page_path):
            await self.app(scope, receive, send)
            return
        response = RedirectResponse(
            _get_moved_page_url(page_path, scope[_QUERY_STRING_KEY]),
            status_code=status.HTTP_301_MOVED_PERMANENTLY,
        )
        await response(scope, receive, send)

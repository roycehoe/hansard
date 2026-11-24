from typing import Optional
from urllib.parse import quote

from fastapi import status
from starlette.responses import RedirectResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from utils.site_address import QUERY_SEPARATOR, URL_SEPARATOR

_HTTP_SCOPE_TYPE = "http"
_PATH_KEY = "path"
_QUERY_STRING_KEY = "query_string"
_QUERY_STRING_ENCODING = "latin-1"
_ABOUT_PATH = "/about"
_HOW_PARLIAMENT_WORKS_PATH = "/how-parliament-works"
_COVERAGE_PATH = "/coverage"
_METHODS_PATH = "/coverage/methods"
_PALETTE_PATH = "/palette"
_API_PATH_PREFIX = "/api/"
_OTHER_HOST_PREFIX = "//"
_ROOT_PATH_WITHOUT_SLASH = ""


def _is_page_moved_under_about(page_path: str) -> bool:
    return (
        page_path == _HOW_PARLIAMENT_WORKS_PATH
        or page_path == _COVERAGE_PATH
        or page_path == _METHODS_PATH
        or page_path == _PALETTE_PATH
    )


# NOTE: the page text and the page preview match a path without its trailing slash, so /people/ served readers without JavaScript an empty page. A path starting with // would make the redirect leave the site, and the API keeps its own slash handling
def _should_drop_trailing_slash(path: str, page_path: str) -> bool:
    return (
        page_path != path
        and page_path != _ROOT_PATH_WITHOUT_SLASH
        and not page_path.startswith(_OTHER_HOST_PREFIX)
        and not path.startswith(_API_PATH_PREFIX)
    )


def _get_url_with_query_string(page_path: str, query_string: bytes) -> str:
    if not query_string:
        return page_path
    return page_path + QUERY_SEPARATOR + query_string.decode(_QUERY_STRING_ENCODING)


def _get_redirect_url(path: str, query_string: bytes) -> Optional[str]:
    page_path = path.rstrip(URL_SEPARATOR)
    if _is_page_moved_under_about(page_path):
        return _get_url_with_query_string(_ABOUT_PATH + page_path, query_string)
    if _should_drop_trailing_slash(path, page_path):
        return _get_url_with_query_string(
            quote(page_path, safe=URL_SEPARATOR), query_string
        )
    return None


class PageRedirectMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != _HTTP_SCOPE_TYPE:
            await self.app(scope, receive, send)
            return
        redirect_url = _get_redirect_url(scope[_PATH_KEY], scope[_QUERY_STRING_KEY])
        if redirect_url is None:
            await self.app(scope, receive, send)
            return
        response = RedirectResponse(
            redirect_url, status_code=status.HTTP_301_MOVED_PERMANENTLY
        )
        await response(scope, receive, send)

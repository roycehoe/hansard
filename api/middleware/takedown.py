import os
from pathlib import Path

from fastapi import Request, Response, status
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from utils.report_slug import get_normalised_report_slug, get_report_id_candidates
from utils.takedown_list import get_taken_down_report_slugs

_TAKEDOWN_LIST_PATH = Path(__file__).resolve().parent.parent / "takedown-list.txt"
_TAKEDOWN_LIST_ENCODING = "utf-8-sig"

# NOTE: read at import so a missing or malformed list stops startup instead of showing a listed report.
_TAKEN_DOWN_REPORT_SLUGS = get_taken_down_report_slugs(
    _TAKEDOWN_LIST_PATH.read_text(encoding=_TAKEDOWN_LIST_ENCODING)
)


def is_report_slug_taken_down(report_slug: str) -> bool:
    return get_normalised_report_slug(report_slug) in _TAKEN_DOWN_REPORT_SLUGS


def is_report_id_taken_down(report_id: str) -> bool:
    return is_report_slug_taken_down(report_id)


def get_taken_down_report_id_candidates() -> list[str]:
    return sorted(
        report_id
        for report_slug in _TAKEN_DOWN_REPORT_SLUGS
        for report_id in get_report_id_candidates(report_slug)
    )


_INDEX_FILE = "index.html"
_PATH_KEY = "path"
_REPORT_PATH_PREFIX = "reports/"
_URL_SEPARATOR = "/"


def _is_report_page_taken_down(request_path: str) -> bool:
    # NOTE: normalised as StaticFiles.get_path does, so every spelling the frontend mount serves is caught.
    frontend_path = os.path.normpath(os.path.join(*request_path.split(_URL_SEPARATOR)))
    if not frontend_path.startswith(_REPORT_PATH_PREFIX):
        return False
    return is_report_slug_taken_down(frontend_path.removeprefix(_REPORT_PATH_PREFIX))


class TakedownMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, frontend_dist_path: Path):
        super().__init__(app)
        self.index_path = frontend_dist_path / _INDEX_FILE

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if _is_report_page_taken_down(request.scope[_PATH_KEY]):
            return FileResponse(self.index_path, status_code=status.HTTP_410_GONE)
        return await call_next(request)

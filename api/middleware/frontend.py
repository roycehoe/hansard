from pathlib import Path
from typing import Optional

from fastapi import Response, status
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import DataError, SQLAlchemyError
from sqlmodel import Session
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.types import Scope

from database.engine import engine
from schemas.preview import PreviewData
from services import preview as preview_service
from services import preview_fetch as preview_fetch_service
from utils.preview_bot import get_preview_bot_name
from utils.preview_tags import (
    get_index_html_with_preview_tags,
    get_preview_tags_html,
    get_structured_data_html,
)

_INDEX_FILE = "index.html"
_ASSETS_PATH_PREFIX = "assets/"
_CACHE_CONTROL_HEADER = "Cache-Control"
# NOTE: Vite puts a hash of each file's contents in the name of every file under assets/, so a new build gets new names and a stored copy is never stale. The page itself keeps its name across builds, so browsers and Cloudflare check it again on each visit and a release shows at once
_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable"
_INDEX_CACHE_CONTROL = "no-cache"
_DIRECTORY_INDEX_PATH = "."
_PATH_KEY = "path"
_SPEECH_ORDINAL_PARAMETER = "s"
_SPEECH_ANCHOR_PARAMETER = "q"
_URL_SEPARATOR = "/"
_USER_AGENT_HEADER = "user-agent"
_NO_STRUCTURED_DATA = ""


def _get_page_preview(
    path: str, speech_ordinal_text: Optional[str], speech_anchor_text: Optional[str]
) -> PreviewData:
    try:
        with Session(engine) as session:
            return preview_service.get_preview(
                path, speech_ordinal_text, speech_anchor_text, session
            )
    except DataError:
        return preview_service.get_not_found_preview()
    except SQLAlchemyError:
        return preview_service.get_default_preview()
    except ValueError:
        return preview_service.get_not_found_preview()


def _get_preview_url(site_url: Optional[str], path: str) -> Optional[str]:
    if site_url is None:
        return None
    return f"{site_url.rstrip(_URL_SEPARATOR)}{path}"


class FrontendFiles(StaticFiles):
    def __init__(self, directory: Path, site_url: Optional[str]):
        super().__init__(directory=directory, html=True)
        self.site_url = site_url
        self.index_html = (directory / _INDEX_FILE).read_text()

    def _get_structured_data_html(self, preview: PreviewData) -> str:
        if self.site_url is None:
            return _NO_STRUCTURED_DATA
        return get_structured_data_html(
            self.site_url, preview.path, preview.report_title, preview.sitting_date
        )

    def _get_preview_tags_html(self, preview: PreviewData) -> str:
        return get_preview_tags_html(
            preview.title,
            preview.description,
            preview.preview_type,
            _get_preview_url(self.site_url, preview.path),
            self._get_structured_data_html(preview),
        )

    async def _get_index_response(self, scope: Scope) -> HTMLResponse:
        request = Request(scope)
        bot_name = get_preview_bot_name(request.headers.get(_USER_AGENT_HEADER, ""))
        if bot_name is not None:
            preview_fetch_service.count_preview_fetch(bot_name, scope[_PATH_KEY])
        query_params = request.query_params
        preview = await run_in_threadpool(
            _get_page_preview,
            scope[_PATH_KEY],
            query_params.get(_SPEECH_ORDINAL_PARAMETER),
            query_params.get(_SPEECH_ANCHOR_PARAMETER),
        )
        return HTMLResponse(
            get_index_html_with_preview_tags(
                self.index_html, self._get_preview_tags_html(preview)
            ),
            status_code=(
                status.HTTP_200_OK if preview.is_found else status.HTTP_404_NOT_FOUND
            ),
            headers={_CACHE_CONTROL_HEADER: _INDEX_CACHE_CONTROL},
        )

    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            response = await super().get_response(path, scope)
        except HTTPException as error:
            if error.status_code != status.HTTP_404_NOT_FOUND:
                raise
            return await self._get_index_response(scope)
        if path == _DIRECTORY_INDEX_PATH:
            return await self._get_index_response(scope)
        if path.startswith(_ASSETS_PATH_PREFIX):
            response.headers[_CACHE_CONTROL_HEADER] = _ASSET_CACHE_CONTROL
        return response

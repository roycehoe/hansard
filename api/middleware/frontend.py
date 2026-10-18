from pathlib import Path
from typing import Optional

from fastapi import Response, status
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.types import Scope

from database.engine import engine
from schemas.preview import PreviewData
from services import preview as preview_service
from utils.preview_tags import (
    get_index_html_with_preview_tags,
    get_preview_tags_html,
)

_INDEX_FILE = "index.html"
_DIRECTORY_INDEX_PATH = "."
_PATH_KEY = "path"
_SPEECH_ORDINAL_PARAMETER = "s"
_SPEECH_ANCHOR_PARAMETER = "q"
_URL_SEPARATOR = "/"


def _get_page_preview(
    path: str, speech_ordinal_text: Optional[str], speech_anchor_text: Optional[str]
) -> PreviewData:
    try:
        with Session(engine) as session:
            return preview_service.get_preview(
                path, speech_ordinal_text, speech_anchor_text, session
            )
    except SQLAlchemyError:
        return preview_service.get_default_preview()
    except ValueError:
        return preview_service.get_default_preview()


def _get_preview_url(site_url: Optional[str], path: str) -> Optional[str]:
    if site_url is None:
        return None
    return f"{site_url.rstrip(_URL_SEPARATOR)}{path}"


class FrontendFiles(StaticFiles):
    def __init__(self, directory: Path, site_url: Optional[str]):
        super().__init__(directory=directory, html=True)
        self.site_url = site_url
        self.index_html = (directory / _INDEX_FILE).read_text()

    def _get_preview_tags_html(
        self,
        path: str,
        speech_ordinal_text: Optional[str],
        speech_anchor_text: Optional[str],
    ) -> str:
        preview = _get_page_preview(path, speech_ordinal_text, speech_anchor_text)
        return get_preview_tags_html(
            preview.title,
            preview.description,
            preview.preview_type,
            _get_preview_url(self.site_url, preview.path),
        )

    async def _get_index_response(self, scope: Scope) -> HTMLResponse:
        query_params = Request(scope).query_params
        preview_tags_html = await run_in_threadpool(
            self._get_preview_tags_html,
            scope[_PATH_KEY],
            query_params.get(_SPEECH_ORDINAL_PARAMETER),
            query_params.get(_SPEECH_ANCHOR_PARAMETER),
        )
        return HTMLResponse(
            get_index_html_with_preview_tags(self.index_html, preview_tags_html)
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
        return response

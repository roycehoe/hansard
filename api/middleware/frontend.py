from fastapi import Response, status
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException
from starlette.types import Scope

_INDEX_FILE = "index.html"


class FrontendFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except HTTPException as error:
            if error.status_code != status.HTTP_404_NOT_FOUND:
                raise
            return await super().get_response(_INDEX_FILE, scope)

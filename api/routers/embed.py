from typing import Optional

from fastapi import APIRouter, Depends, Path, Query
from fastapi.responses import HTMLResponse
from sqlmodel import Session

from database.engine import get_session
from middleware import embed as embed_middleware

_MAX_SPEECH_ANCHOR_LENGTH = 200
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"

router = APIRouter(tags=["embed"])


@router.api_route(
    "/embed/reports/{report_slug}",
    methods=["GET", "HEAD"],
    response_class=HTMLResponse,
    include_in_schema=False,
)
def get_speech_embed(
    report_slug: str = Path(pattern=_NO_NUL_BYTE_PATTERN),
    speech_ordinal: Optional[int] = Query(default=None, alias="s", ge=0),
    speech_anchor: Optional[str] = Query(
        default=None, alias="q", max_length=_MAX_SPEECH_ANCHOR_LENGTH
    ),
    session: Session = Depends(get_session),
) -> HTMLResponse:
    speech_embed = embed_middleware.get_speech_embed(
        report_slug, speech_ordinal, speech_anchor, session
    )
    return HTMLResponse(speech_embed.html, status_code=speech_embed.status_code)

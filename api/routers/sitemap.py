from fastapi import APIRouter, Depends, Response
from sqlmodel import Session

from database.engine import get_session
from services import sitemap as sitemap_service

_XML_MEDIA_TYPE = "application/xml"
_CACHE_CONTROL_HEADER = "Cache-Control"
_CACHE_CONTROL = "public, max-age=3600"

router = APIRouter(tags=["sitemap"])


@router.api_route("/sitemap.xml", methods=["GET", "HEAD"], status_code=200)
def get_sitemap_index(session: Session = Depends(get_session)) -> Response:
    return Response(
        sitemap_service.get_sitemap_xml(
            sitemap_service.SITEMAP_INDEX_FILE_NAME, session
        ),
        media_type=_XML_MEDIA_TYPE,
        headers={_CACHE_CONTROL_HEADER: _CACHE_CONTROL},
    )


@router.api_route("/sitemap-{file_stem}.xml", methods=["GET", "HEAD"], status_code=200)
def get_sitemap_file(
    file_stem: str, session: Session = Depends(get_session)
) -> Response:
    return Response(
        sitemap_service.get_sitemap_xml(f"sitemap-{file_stem}.xml", session),
        media_type=_XML_MEDIA_TYPE,
        headers={_CACHE_CONTROL_HEADER: _CACHE_CONTROL},
    )

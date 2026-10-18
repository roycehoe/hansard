from fastapi import APIRouter

from schemas.preview_fetch import GetPreviewFetchesResponse
from services import preview_fetch as preview_fetch_service

router = APIRouter(prefix="/preview-fetches", tags=["preview-fetches"])


@router.get("", status_code=200)
def get_preview_fetches() -> GetPreviewFetchesResponse:
    return preview_fetch_service.get_preview_fetches()

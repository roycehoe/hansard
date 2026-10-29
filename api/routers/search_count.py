from fastapi import APIRouter

from schemas.search_count import GetSearchCountsResponse
from services import search_count as search_count_service

router = APIRouter(prefix="/search-counts", tags=["search-counts"])


@router.get("", status_code=200)
def get_search_counts() -> GetSearchCountsResponse:
    return search_count_service.get_search_counts()

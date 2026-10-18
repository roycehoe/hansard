from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.engine import get_session
from schemas.refresh import GetRefreshResponse
from services import refresh as refresh_service

router = APIRouter(prefix="/refresh", tags=["refresh"])


@router.get("", status_code=200)
def get_refresh(session: Session = Depends(get_session)) -> GetRefreshResponse:
    return refresh_service.get_refresh(session)

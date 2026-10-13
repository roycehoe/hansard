from fastapi import APIRouter
from sqlmodel import Session, text

from database.engine import engine

router = APIRouter()


@router.get("/health")
def get_health() -> dict[str, str]:
    with Session(engine) as session:
        session.exec(text("SELECT 1"))
    return {"status": "ok"}

from fastapi import APIRouter

router = APIRouter()


# NOTE: the only async handler, so the platform's check answers on the event loop and never waits for a worker thread that a slow request holds
@router.get("/health")
async def get_health() -> dict[str, str]:
    return {"status": "ok"}

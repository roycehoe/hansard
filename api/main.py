from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from middleware.request_log import RequestLogMiddleware
from middleware.response_cache import ResponseCacheMiddleware
from routers import (
    coverage,
    health,
    parliament,
    party,
    person,
    preview_fetch,
    refresh,
    report,
    search,
    sitting,
)
from settings import settings

_OPENAPI_URL = "/openapi.json"
_GZIP_COMPRESSION_LEVEL = 4

app = FastAPI(
    title="Open Hansard API",
    openapi_url=None if settings.is_public_mode else _OPENAPI_URL,
)

# NOTE: level 4, not the default 9, because a long report then compresses in about 40% of the time for 6 to 9% more bytes
app.add_middleware(GZipMiddleware, compresslevel=_GZIP_COMPRESSION_LEVEL)

app.add_middleware(ResponseCacheMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLogMiddleware)

app.include_router(health.router)
app.include_router(report.router)
app.include_router(sitting.router)
app.include_router(parliament.router)
app.include_router(person.router)
app.include_router(party.router)
app.include_router(search.router)
app.include_router(coverage.router)
app.include_router(refresh.router)
app.include_router(preview_fetch.router)

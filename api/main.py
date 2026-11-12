from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from middleware.request_log import RequestLogMiddleware
from middleware.response_cache import ResponseCacheMiddleware
from routers import (
    act,
    attached_file,
    bill,
    coverage,
    division,
    health,
    leave_period,
    minutes,
    office,
    parliament,
    party,
    person,
    person_bill,
    refresh,
    report,
    report_link,
    search,
    search_count,
    seat,
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
app.include_router(report_link.router)
app.include_router(sitting.router)
app.include_router(parliament.router)
app.include_router(person.router)
app.include_router(leave_period.router)
app.include_router(seat.router)
app.include_router(party.router)
app.include_router(search.router)
app.include_router(coverage.router)
app.include_router(refresh.router)
app.include_router(search_count.router)
app.include_router(person_bill.router)
app.include_router(bill.router)
app.include_router(act.router)
app.include_router(office.router)
app.include_router(attached_file.router)
app.include_router(division.router)
app.include_router(minutes.router)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from routers import (
    coverage,
    health,
    parliament,
    party,
    person,
    report,
    search,
    sitting,
)

app = FastAPI(title="Hansard API")

app.add_middleware(GZipMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(report.router)
app.include_router(sitting.router)
app.include_router(parliament.router)
app.include_router(person.router)
app.include_router(party.router)
app.include_router(search.router)
app.include_router(coverage.router)

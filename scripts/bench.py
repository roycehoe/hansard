"""Uncached benchmark of every Hansard API endpoint, run by hand. Never run in CI.

Calls the deployed app (website.py, with main.py under /api) in process. Before
every request it empties the response cache and the module caches, so each
answer is computed. Postgres's buffer cache is left warm.
Needs DATABASE_URL set to the scratch database (localhost:5435/hansard_launch).

  uv run --project api python scripts/bench.py [--rounds 6] [--only substr]
      [--buffers] [--out results.json]
It takes a lock and re-runs itself under nice -n 10. BENCH_PLANNER=local turns off
the production planner settings. --buffers re-runs one warm request's statements
under EXPLAIN (ANALYZE, BUFFERS).
"""

import argparse
import asyncio
import fcntl
import gc
import json
import os
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import quote

from sqlalchemy.engine import make_url

SCRATCH_HOST = "localhost"
SCRATCH_PORT = 5435
SCRATCH_DATABASE = "hansard_launch"
LOCK_PATH = Path(tempfile.gettempdir()) / "hansard-bench.lock"
REPO_API_DIR = Path(
    os.environ.get("HANSARD_API_DIR", Path(__file__).resolve().parent.parent / "api")
)


def refuse_unless_scratch_database() -> None:
    database_url = make_url(os.environ.get("DATABASE_URL", "driver://"))
    if (database_url.host, database_url.port, database_url.database) != (
        SCRATCH_HOST,
        SCRATCH_PORT,
        SCRATCH_DATABASE,
    ):
        sys.exit(
            f"Refusing to run: DATABASE_URL must point at {SCRATCH_HOST}:{SCRATCH_PORT}/{SCRATCH_DATABASE}."
        )


def rerun_under_lock_and_nice() -> None:
    """Hold the lock for the whole run so timings never overlap, and lower our priority."""
    if os.environ.get("BENCH_LOCK_HELD") == "1":
        return
    with open(LOCK_PATH, "w") as lock_file:
        fcntl.flock(lock_file, fcntl.LOCK_EX)
        env = {**os.environ, "BENCH_LOCK_HELD": "1"}
        sys.exit(
            subprocess.call(["nice", "-n", "10", sys.executable, *sys.argv], env=env)
        )


if __name__ == "__main__":
    refuse_unless_scratch_database()
    rerun_under_lock_and_nice()

os.environ["SITE_URL"] = "https://bench.example"
os.environ["PUBLIC_MODE"] = "true"
os.environ.pop("GOATCOUNTER_SITE_URL", None)
os.environ.pop("GOATCOUNTER_API_TOKEN", None)
os.environ.pop("TAKEDOWN_REPORT_SLUGS", None)
_dist = Path(tempfile.mkdtemp(prefix="bench_dist_"))
(_dist / "index.html").write_text(
    "<html><head><!-- preview-tags:start --><!-- preview-tags:end --></head><body></body></html>"
)
os.environ["FRONTEND_DIST_PATH"] = str(_dist)
sys.path.insert(0, str(REPO_API_DIR))

import httpx
import website
from database import engine as engine_module
from middleware import response_cache
from services import coverage, parliament, preview, sitemap
from sqlalchemy import event

R = quote  # slugs carry '#', so encode them

LONG_1962_BILL = "00069077-ZZ.00051219-ZZ_1#id003_19620704_S0002_T00022-bill"

# (group, label, path). group names the endpoint; label names the input.
CASES = [
    ("health", "health", "/api/health"),
    ("refresh", "refresh", "/api/refresh"),
    ("parties", "parties", "/api/parties"),
    ("search-counts", "search-counts", "/api/search-counts"),
    ("parliaments", "parliaments (uncached fill)", "/api/parliaments"),
    ("coverage", "coverage (uncached fill)", "/api/coverage"),
    ("people", "all", "/api/people"),
    ("people", "P14", "/api/people?parliament_number=14"),
    ("people", "P0", "/api/people?parliament_number=0"),
    ("people", "party WP", "/api/people?party=" + R("Workers' Party")),
    ("people", "constituency tampines", "/api/people?constituency=tampines"),
    ("person", "170 (17k speeches)", "/api/people/170"),
    ("person", "349 (12.5k)", "/api/people/349"),
    ("person", "29 (12.4k)", "/api/people/29"),
    ("person", "547 (14)", "/api/people/547"),
    ("person-reports", "170 p1", "/api/people/170/reports"),
    ("person-reports", "170 p75", "/api/people/170/reports?page=75"),
    ("person-reports", "29 p30", "/api/people/29/reports?page=30"),
    ("person-reports", "547 p1", "/api/people/547/reports"),
    ("sittings", "P14", "/api/sittings?parliament_number=14"),
    ("sittings", "P0", "/api/sittings?parliament_number=0"),
    ("sittings", "P1", "/api/sittings?parliament_number=1"),
    ("sitting", "2026-09-08 (198 reports)", "/api/sittings/2026-09-08"),
    ("sitting", "1955-05-16 (1 report)", "/api/sittings/1955-05-16"),
    ("report", "1962 bill (1,107 speeches)", "/api/reports/" + R(LONG_1962_BILL)),
    ("report", "motion-3008 (1,074)", "/api/reports/motion-3008"),
    ("report", "budget-2046", "/api/reports/budget-2046"),
    (
        "report",
        "ministerial-statement-2995 (46)",
        "/api/reports/ministerial-statement-2995",
    ),
    ("report", "bill-intro-472 (3)", "/api/reports/bill-intro-472"),
    ("report", "motion-3008 s=500", "/api/reports/motion-3008?s=500"),
    (
        "matched-words",
        "motion-3008 government",
        "/api/reports/motion-3008/matched-words?q=government",
    ),
    (
        "matched-words",
        "1962 bill minister",
        "/api/reports/" + R(LONG_1962_BILL) + "/matched-words?q=minister",
    ),
    ("search-speeches", "government", "/api/search/speeches?q=government"),
    (
        "search-speeches",
        "government sort=date",
        "/api/search/speeches?q=government&sort=date",
    ),
    (
        "search-speeches",
        "government sort=oldest",
        "/api/search/speeches?q=government&sort=oldest",
    ),
    ("search-speeches", "government p50", "/api/search/speeches?q=government&page=50"),
    ("search-speeches", "bill", "/api/search/speeches?q=bill"),
    (
        "search-speeches",
        "sir sort=date p50",
        "/api/search/speeches?q=sir&sort=date&page=50",
    ),
    ("search-speeches", "durian (rare)", "/api/search/speeches?q=durian"),
    (
        "search-speeches",
        '"public housing"',
        "/api/search/speeches?q=" + R('"public housing"'),
    ),
    (
        "search-speeches",
        "housing P14",
        "/api/search/speeches?q=housing&parliament_number=14",
    ),
    (
        "search-speeches",
        "government P14 p50",
        "/api/search/speeches?q=government&parliament_number=14&page=50",
    ),
    (
        "search-speeches",
        "housing 2020 range",
        "/api/search/speeches?q=housing&date_from=2020-01-01&date_to=2020-12-31",
    ),
    (
        "search-speeches",
        "housing 2020 range date",
        "/api/search/speeches?q=housing&date_from=2020-01-01&date_to=2020-12-31&sort=date",
    ),
    (
        "search-speeches",
        "housing written-answer",
        "/api/search/speeches?q=housing&report_type=written-answer",
    ),
    (
        "search-speeches",
        "sir written-answer",
        "/api/search/speeches?q=sir&report_type=written-answer",
    ),
    (
        "search-speeches",
        "housing person 170",
        "/api/search/speeches?q=housing&person_id=170",
    ),
    ("search-speeches", "sir person 349", "/api/search/speeches?q=sir&person_id=349"),
    (
        "search-speeches",
        "housing seat tampines",
        "/api/search/speeches?q=housing&constituency=Tampines",
    ),
    (
        "search-speeches",
        "government in report motion-3008",
        "/api/search/speeches?q=government&report=motion-3008",
    ),
    ("search-speeches", "browse P14", "/api/search/speeches?parliament_number=14"),
    ("search-speeches", "browse person 170", "/api/search/speeches?person_id=170"),
    (
        "search-speeches",
        "browse person 170 p50",
        "/api/search/speeches?person_id=170&page=50",
    ),
    (
        "search-speeches",
        "browse seat tampines",
        "/api/search/speeches?constituency=Tampines",
    ),
    (
        "search-speeches",
        "browse Jan 2020",
        "/api/search/speeches?date_from=2020-01-01&date_to=2020-01-31",
    ),
    ("search-reports", "bill", "/api/search/reports?q=bill"),
    ("search-reports", "bill sort=date", "/api/search/reports?q=bill&sort=date"),
    ("search-reports", "bill p50", "/api/search/reports?q=bill&page=50"),
    ("search-reports", "covid sort=oldest", "/api/search/reports?q=covid&sort=oldest"),
    ("search-reports", "durian", "/api/search/reports?q=durian"),
    (
        "search-reports",
        "housing text only",
        "/api/search/reports?q=housing&is_text_available=true",
    ),
    ("search-reports", "no text", "/api/search/reports?is_text_available=false"),
    ("search-reports", "browse P14", "/api/search/reports?parliament_number=14"),
    ("search-reports", "browse budget", "/api/search/reports?report_type=budget"),
    ("page-preview", "report page motion-3008", "/reports/motion-3008"),
    ("page-preview", "report page motion-3008 s=500", "/reports/motion-3008?s=500"),
    ("page-preview", "person page 170", "/people/170-x"),
    ("page-preview", "sitting page 2026-09-08", "/sittings/2026-09-08"),
    ("page-preview", "home", "/"),
    ("sitemap", "sitemap.xml (uncached fill)", "/sitemap.xml"),
    ("sitemap", "robots.txt", "/robots.txt"),
]

_statements: list[dict] = []


def _hook(engine, engine_name: str) -> None:
    @event.listens_for(engine, "before_cursor_execute")
    def _before(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("bench_start", []).append(time.perf_counter())

    @event.listens_for(engine, "after_cursor_execute")
    def _after(conn, cursor, statement, parameters, context, executemany):
        started = conn.info["bench_start"].pop()
        _statements.append(
            {
                "engine": engine_name,
                "ms": (time.perf_counter() - started) * 1000,
                "sql": statement,
                "params": parameters,
            }
        )


_hook(engine_module.engine, "main")
_hook(engine_module.search_engine, "search")

# Production's planner settings (docs/required-indexes.md). Default on; BENCH_PLANNER=local turns them off.
PROD_PLANNER_SETTINGS = (
    "SET work_mem = '2MB'; SET random_page_cost = 1; SET effective_cache_size = '568MB'"
)
IS_PROD_PLANNER = os.environ.get("BENCH_PLANNER", "prod") != "local"


def _set_prod_planner(dbapi_connection, connection_record) -> None:
    cursor = dbapi_connection.cursor()
    for setting in PROD_PLANNER_SETTINGS.split("; "):
        cursor.execute(setting)
    dbapi_connection.commit()  # a SET inside a rolled-back transaction would be undone


if IS_PROD_PLANNER:
    event.listen(engine_module.engine, "connect", _set_prod_planner)
    event.listen(engine_module.search_engine, "connect", _set_prod_planner)


def clear_caches() -> None:
    response_cache._cache_key_to_cached_response = {}
    coverage._cached_coverage = None
    parliament._cached_all_parliaments = None
    preview._cache_key_to_cached_preview = {}
    sitemap._cached_file_name_to_xml = None


async def run_once(client: httpx.AsyncClient, path: str) -> dict:
    clear_caches()
    _statements.clear()
    started = time.perf_counter()
    response = await client.get(path, headers={"Accept-Encoding": "gzip"})
    body = response.content  # read the whole body
    wall_ms = (time.perf_counter() - started) * 1000
    statements = list(_statements)
    return {
        "status": response.status_code,
        "wall_ms": wall_ms,
        "sql_ms": sum(s["ms"] for s in statements),
        "statement_count": len(statements),
        "wire_bytes": int(response.headers.get("content-length", len(body))),
        "slowest": max(statements, key=lambda s: s["ms"]) if statements else None,
        "statements": statements,
    }


def _walk_plan(node: dict, depth: int = 0) -> list[str]:
    line = "  " * depth + node["Node Type"]
    if "Index Name" in node:
        line += f" on {node['Index Name']}"
    elif "Relation Name" in node:
        line += f" on {node['Relation Name']}"
    line += f" rows={node.get('Actual Rows')} loops={node.get('Actual Loops')} t={node.get('Actual Total Time')}"
    lines = [line]
    for child in node.get("Plans", []):
        lines += _walk_plan(child, depth + 1)
    return lines


def explain_statements(statements: list[dict]) -> list[dict]:
    explained = []
    for statement in statements:
        engine = (
            engine_module.search_engine
            if statement["engine"] == "search"
            else engine_module.engine
        )
        raw = engine.raw_connection()
        try:
            cursor = raw.cursor()
            cursor.execute(
                "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + statement["sql"],
                statement["params"],
            )
            plan = cursor.fetchone()[0][0]
            raw.rollback()
        finally:
            raw.close()
        top = plan["Plan"]
        explained.append(
            {
                "engine": statement["engine"],
                "sql": statement["sql"][:4000],
                "execution_ms": plan.get("Execution Time"),
                "planning_ms": plan.get("Planning Time"),
                "shared_hit": top.get("Shared Hit Blocks", 0),
                "shared_read": top.get("Shared Read Blocks", 0),
                "temp_written": top.get("Temp Written Blocks", 0),
                "jit_ms": (plan.get("JIT") or {}).get("Timing", {}).get("Total"),
                "plan": _walk_plan(top)[:40],
            }
        )
    return explained


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rounds", type=int, default=6)
    parser.add_argument("--only", default=None, help="substring of group or label")
    parser.add_argument("--buffers", action="store_true")
    parser.add_argument("--out", default="results.json")
    args = parser.parse_args()

    cases = [
        case
        for case in CASES
        if args.only is None or args.only in case[0] or args.only in case[1]
    ]
    transport = httpx.ASGITransport(app=website.app)
    results = {
        f"{g} | {l}": {"group": g, "label": l, "path": p, "runs": []}
        for g, l, p in cases
    }

    async with httpx.AsyncClient(
        transport=transport, base_url="http://bench"
    ) as client:
        await client.get("/api/health")  # open a main-engine connection
        await client.get("/api/search/speeches?q=durian")  # and a search-engine one
        for round_number in range(args.rounds):
            for group, label, path in cases:
                gc.collect()
                run = await run_once(client, path)
                run["round"] = round_number + 1
                results[f"{group} | {label}"]["runs"].append(run)
            print(f"round {round_number + 1} done", file=sys.stderr)
        if args.buffers:
            for key, result in results.items():
                last_run = result["runs"][-1]
                result["explained"] = explain_statements(last_run["statements"])
                print(f"explained {key}", file=sys.stderr)

    summary = []
    for key, result in results.items():
        runs = result["runs"]
        warm = runs[1:] or runs
        row = {
            "key": key,
            "path": result["path"],
            "status": runs[0]["status"],
            "first_wall_ms": round(runs[0]["wall_ms"], 1),
            "warm_wall_ms": round(statistics.median(r["wall_ms"] for r in warm), 1),
            "warm_wall_max_ms": round(max(r["wall_ms"] for r in warm), 1),
            "warm_sql_ms": round(statistics.median(r["sql_ms"] for r in warm), 1),
            "statements": runs[-1]["statement_count"],
            "wire_kb": round(runs[-1]["wire_bytes"] / 1024, 1),
            "slowest_ms": round(runs[-1]["slowest"]["ms"], 1)
            if runs[-1]["slowest"]
            else None,
            "slowest_sql": (
                runs[-1]["slowest"]["sql"][:300] if runs[-1]["slowest"] else None
            ),
        }
        if "explained" in result:
            row["shared_hit"] = sum(e["shared_hit"] for e in result["explained"])
            row["shared_read"] = sum(e["shared_read"] for e in result["explained"])
            row["temp_written"] = sum(e["temp_written"] for e in result["explained"])
            row["jit_ms"] = round(sum(e["jit_ms"] or 0 for e in result["explained"]), 1)
        summary.append(row)
        for run in runs:
            run["statements"] = [
                {
                    "engine": s["engine"],
                    "ms": round(s["ms"], 2),
                    "sql": s["sql"][:4000],
                    "params": {k: str(v)[:200] for k, v in (s["params"] or {}).items()}
                    if isinstance(s["params"], dict)
                    else str(s["params"])[:400],
                }
                for s in run["statements"]
            ]
            if run["slowest"]:
                run["slowest"] = {
                    "ms": round(run["slowest"]["ms"], 2),
                    "sql": run["slowest"]["sql"][:1000],
                }

    Path(args.out).write_text(
        json.dumps({"summary": summary, "results": results}, indent=1, default=str)
    )
    width = max(len(r["key"]) for r in summary)
    print(f"{'case':<{width}}  status  first  warm  max  sql  stmts  kB  hit+read  jit")
    for r in summary:
        buffers = (
            f"{r.get('shared_hit', '')}+{r.get('shared_read', '')}"
            if "shared_hit" in r
            else ""
        )
        print(
            f"{r['key']:<{width}}  {r['status']}  {r['first_wall_ms']:>7}  {r['warm_wall_ms']:>7}  "
            f"{r['warm_wall_max_ms']:>7}  {r['warm_sql_ms']:>7}  {r['statements']:>3}  {r['wire_kb']:>6}  {buffers}  {r.get('jit_ms', '')}"
        )


if __name__ == "__main__":
    asyncio.run(main())

# Execution Plan: Hansard user stories

Source: `plans/hansard-user-stories.md` (revised after the adversarial review) and `plans/hansard-user-stories-brief.md`. Conventions: `api/CLAUDE.md`, `api/STYLE.md`, `api/STYLE-RULINGS.md`, `app/CLAUDE.md`, `app/STYLE.md`. The root `CLAUDE.md` only delegates, apart from the git rules (Conventional Commits, subject under 72 characters, straight to `master`, no attribution).

Volatile constants, confirmed from the plan: page size 20, page cap 100, statement timeout 30,000 ms, `ts_headline` options `StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15`, text search configuration `english`, SPRS base `https://sprs.parl.gov.sg/search`, Legislative Assembly label for Parliament 0, latest membership Parliament 15, attribution figures 97.61% / 90.42% / 96.81% measured 2026-10-13 for Parliaments 0 to 11, coverage cache one hour, query max length 200, citation title `Singapore Parliamentary Debates, Official Report` and, for Parliament 0, `Singapore Legislative Assembly Debates, Official Report`.

Orchestration note: commits run in this order. Steps 1 to 9 are sequential. Steps 10 to 14 touch disjoint service and router files and may be implemented concurrently, with `main.py` edited by the orchestrator only. Steps 17 to 27 run in order, because TanStack Router type-checks every `Link` target against the route tree, so a page may link only to routes that earlier steps created; the four deferrals in steps 21 to 26 exist for that reason. `SiteHeader.tsx`, `SiteFooter.tsx`, `main.tsx`, `index.css` and `routeTree.gen.ts` are edited by the orchestrator only. Checks run on the whole tree before each commit in a concurrent group lands.

## Amendments

_This section is left empty. When the execution skill discovers that implementation must deviate from a step, whether a method name is wrong, a join path differs, or a constant changes, it appends the amendment here rather than silently adapting. The plan remains the authoritative record._

---

## Completion Checklist

- [ ] Each step's "Expected state" block verified before proceeding to the next step
- [ ] `uv run ruff check .` and `uv run ruff format --check .` pass after every API commit
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass after every app commit; `pnpm contrast` after step 27
- [ ] No file outside `api/database/` names a Membership "speaker" except in SQL column references (`grep -rn "speaker" api/services api/schemas api/routers api/middleware | grep -v "speaker_id\|speaker_label\|speaker_name\|\.speaker\b"` finds nothing: the column references `speaker_id` and `.speaker` and the `speaker_label` and `speaker_name` fields are the only allowed uses)
- [ ] `grep -rn --include="*.py" "'english'" api/crud` finds only `literal_column("'english'")` in `crud/text_search.py`
- [ ] `grep -rn "dangerouslySetInnerHTML" app/src` finds nothing
- [ ] `grep -rn "@" app/src/components/layout/SiteFooter.tsx` finds no literal email address
- [ ] No `dataclass` in `api/crud` or `api/database`

_Server-dependent checks (fastapi dev, endpoint responses, EXPLAIN output) are run by the orchestrator after execution, not by this plan's static checks._

---

## 1. `feat: add the read-only session and the six table models`

**Files:** `api/database/engine.py`, `api/database/report.py`, `api/database/speech.py`, `api/database/sitting.py`, `api/database/attendance.py`, `api/database/speaker.py`, `api/database/person.py`

**Pattern reference:**
- `api/database/engine.py` → `api/database/engine.py:L1-L5` (existing engine) plus the kelix `database/init.py` `get_session` generator shape
- `api/database/*.py` → none, introducing new pattern (columns copied from the scraper's models, which are not imported)

`engine.py`:

```python
from collections.abc import Generator

from sqlmodel import Session, create_engine

from settings import settings

_STATEMENT_TIMEOUT_MILLISECONDS = 30_000
_CONNECTION_OPTIONS = (
    f"-c default_transaction_read_only=on -c statement_timeout={_STATEMENT_TIMEOUT_MILLISECONDS}"
)

engine = create_engine(
    settings.database_url,
    connect_args={"options": _CONNECTION_OPTIONS},
    pool_pre_ping=True,
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

Models. SQLModel names the table after the lowercased class, which matches the scraper's tables. Each file: `from typing import Optional` and `from sqlmodel import Field, SQLModel`. No relationships, no dataclasses. Field order: primary key, business fields, booleans, foreign key ids.

```python
# database/report.py
from datetime import datetime

class Report(SQLModel, table=True):
    id: int = Field(primary_key=True)
    volume_number: int
    parliament_number: int
    sitting_number: Optional[int] = None
    sitting_date: datetime
    speech_number: int
    title: str
    subtitle: Optional[str] = None
    report_id: str
    report_type: str
    html_file_name: Optional[str] = None
    markdown_content: Optional[str] = None
    report_version: str

# database/speech.py
class Speech(SQLModel, table=True):
    id: int = Field(primary_key=True)
    ordinal: int
    speaker: Optional[str] = None
    transcript: str
    report_id: Optional[int] = None
    speaker_id: Optional[int] = None

# database/sitting.py
class Sitting(SQLModel, table=True):
    id: int = Field(primary_key=True)
    session_no: Optional[int] = None
    sitting_date: Optional[str] = None

# database/attendance.py
class Attendance(SQLModel, table=True):
    id: int = Field(primary_key=True)
    speaker_name: Optional[str] = None
    location_name: Optional[str] = None
    is_present: Optional[bool] = None
    sitting_id: Optional[int] = None
    speaker_id: Optional[int] = None

# database/speaker.py
class Speaker(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    party: str
    parliament_number: int
    is_legislative_assembly: bool
    is_member: bool
    person_id: Optional[int] = None

# database/person.py
class Person(SQLModel, table=True):
    id: int = Field(primary_key=True)
    canonical_name: str
```

`report_type` is `str`, never the enum: a SQLAlchemy `Enum` column maps by member name and would fail on `oral-answer`.

**Expected state after this commit:**
- [ ] `get_session` is defined in `api/database/engine.py`; `create_engine` passes `connect_args` with both options
- [ ] Six `SQLModel` classes with `table=True`, one per file, with the column lists above; `Report` has `html_file_name`
- [ ] `uv run ruff check .` and `uv run ruff format --check .` pass

---

## 2. `feat: add the report type and search sort enums`

**Files:** `api/enums.py`

**Pattern reference:** none, introducing new pattern (flat module of `StrEnum` classes)

```python
from enum import StrEnum


class ReportType(StrEnum):
    ORAL_ANSWER = "oral-answer"
    WRITTEN_ANSWER = "written-answer"
    WRITTEN_ANSWER_NA = "written-answer-na"
    CLARIFICATION = "clarification"
    MOTION = "motion"
    MATTER_ADJ = "matter-adj"
    BILL = "bill"
    BILL_INTRO = "bill-intro"
    MINISTERIAL_STATEMENT = "ministerial-statement"
    WRITTEN_STATEMENT = "written-statement"
    BUDGET = "budget"
    SPEAKER = "speaker"
    DEPUTY_SPEAKER = "deputy-speaker"
    PERSONAL_EXPLANATION = "personal-explanation"
    POINT_OF_ORDER = "point-of-order"
    TRIBUTE = "tribute"
    PRESIDENT_ADDRESS = "president-address"
    PETITION = "petition"
    ADMIN_OATHS = "admin-oaths"
    OBITUARY_SPEECH = "obituary-speech"
    YANG_DI_MESSAGE = "yang-di-message"
    MISC = "misc"
    ATBP = "atbp"


class SearchSort(StrEnum):
    RELEVANCE = "relevance"
    DATE = "date"
```

Values keep the stored casing because this API never persists them (R16; R37 does not apply).

**Expected state after this commit:**
- [ ] `ReportType` has 23 members and `SearchSort` 2 in `api/enums.py`
- [ ] `uv run ruff check .` passes

---

## 3. `feat: add the exception base and the not-found exceptions`

**Files:** `api/exceptions/__init__.py`, `api/exceptions/base.py`, `api/exceptions/report.py`, `api/exceptions/sitting.py`, `api/exceptions/person.py`

**Pattern reference:**
- `api/exceptions/base.py` → kelix `api/exceptions/base.py:L277-L282` (`ErrorSpec` and the `ERRORS` mapping) and `L1016-L1034` (`AppHttpExceptionBase`)
- `api/exceptions/report.py` → kelix `api/exceptions/eula.py:L1-L6`

```python
# exceptions/base.py
from dataclasses import dataclass
from enum import StrEnum, unique
from typing import Final, Mapping, TypedDict

from fastapi import HTTPException, status


@unique
class ErrorCode(StrEnum):
    REPORT_NOT_FOUND = "report.not_found"
    SITTING_NOT_FOUND = "sitting.not_found"
    PERSON_NOT_FOUND = "person.not_found"


@dataclass(frozen=True, slots=True)
class ErrorSpec:
    status_code: int
    message: str


class ErrorDetail(TypedDict):
    error_code: ErrorCode
    message: str


ERRORS: Final[Mapping[ErrorCode, ErrorSpec]] = {
    ErrorCode.REPORT_NOT_FOUND: ErrorSpec(status.HTTP_404_NOT_FOUND, "Report not found."),
    ErrorCode.SITTING_NOT_FOUND: ErrorSpec(status.HTTP_404_NOT_FOUND, "Sitting not found."),
    ErrorCode.PERSON_NOT_FOUND: ErrorSpec(status.HTTP_404_NOT_FOUND, "Person not found."),
}


class AppHttpExceptionBase(HTTPException):
    def __init__(self, error_code: ErrorCode):
        error_spec = ERRORS[error_code]
        detail: ErrorDetail = ErrorDetail(error_code=error_code, message=error_spec.message)
        super().__init__(status_code=error_spec.status_code, detail=detail)
        self.error_code: ErrorCode = error_code
        self.error_message: str = error_spec.message
```

Each domain file holds one class:

```python
from exceptions.base import AppHttpExceptionBase, ErrorCode


class ReportNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.REPORT_NOT_FOUND)
```

`ERRORS` is the one mapping constant `api/STYLE.md` permits (R34); the `ErrorSpec` dataclass lives only here. `__init__` has no return annotation (R13).

**Expected state after this commit:**
- [ ] `ErrorCode`, `ErrorSpec`, `ERRORS`, `AppHttpExceptionBase` exist in `api/exceptions/base.py`
- [ ] `ReportNotFoundException`, `SittingNotFoundException`, `PersonNotFoundException` exist and take no arguments
- [ ] `uv run ruff check .` passes

---

## 4. `feat: add slug, official record, sitting date and like helpers`

**Files:** `api/utils/__init__.py`, `api/utils/report_slug.py`, `api/utils/official_record.py`, `api/utils/person_slug.py`, `api/utils/sitting_date.py`, `api/utils/like_pattern.py`

**Pattern reference:** none, introducing new pattern (pure functions; `api/CLAUDE.md` `utils/` row)

```python
# utils/report_slug.py
_REPORT_ID_SUFFIX = "#"


def get_report_slug(report_id: str) -> str:
    return report_id.rstrip(_REPORT_ID_SUFFIX)


def get_report_id_candidates(report_slug: str) -> tuple[str, str]:
    return (report_slug + _REPORT_ID_SUFFIX, report_slug + _REPORT_ID_SUFFIX * 2)
```

```python
# utils/official_record.py
from typing import Optional
from urllib.parse import quote

from utils.report_slug import get_report_slug

_SPRS_SEARCH_URL = "https://sprs.parl.gov.sg/search"
_SPRS3_TOPIC_URL = f"{_SPRS_SEARCH_URL}/#/sprs3topic"
_SPRS2_TOPIC_URL = f"{_SPRS_SEARCH_URL}/#/topic"
_SPRS3_REPORT_VERSION = "sprs3"


def get_official_record_url(report_id: str, report_version: str, html_file_name: Optional[str]) -> str:
    if report_version == _SPRS3_REPORT_VERSION:
        return f"{_SPRS3_TOPIC_URL}?reportid={quote(get_report_slug(report_id), safe='')}"
    if html_file_name is None:
        return _SPRS_SEARCH_URL
    return f"{_SPRS2_TOPIC_URL}?reportid={quote(html_file_name, safe='')}"
```

Worked values: `("oral-answer-3851#", "sprs3", None)` gives `https://sprs.parl.gov.sg/search/#/sprs3topic?reportid=oral-answer-3851`; `("00000492-XA.00063644-ZZ_1#id023_19930730_S0003_T00071-bill#", "sprs2", "023_19930730_S0003_T0007")` gives `https://sprs.parl.gov.sg/search/#/topic?reportid=023_19930730_S0003_T0007`.

```python
# utils/person_slug.py
import re

_NON_ALPHANUMERIC_RUN = re.compile(r"[^a-z0-9]+")
_SLUG_SEPARATOR = "-"


def get_person_slug(canonical_name: str) -> str:
    return _NON_ALPHANUMERIC_RUN.sub(_SLUG_SEPARATOR, canonical_name.lower()).strip(_SLUG_SEPARATOR)
```

```python
# utils/sitting_date.py
from datetime import date


def get_sitting_date_text(sitting_date: date) -> str:
    return f"{sitting_date.day}-{sitting_date.month}-{sitting_date.year}"
```

```python
# utils/like_pattern.py
_LIKE_ESCAPE = "\\"
_LIKE_WILDCARDS = ("%", "_")


def escape_like_pattern(text: str) -> str:
    escaped = text.replace(_LIKE_ESCAPE, _LIKE_ESCAPE * 2)
    for wildcard in _LIKE_WILDCARDS:
        escaped = escaped.replace(wildcard, _LIKE_ESCAPE + wildcard)
    return escaped
```

`get_sitting_date_text(date(1957, 1, 9))` is `"9-1-1957"`.

**Expected state after this commit:**
- [ ] The six functions exist with the signatures above; no `utils/` module imports `database/`, `crud/` or `services/`
- [ ] `uv run ruff check .` passes

---

## 5. `feat: add the CRUD classes for the six tables`

**Files:** `api/crud/__init__.py`, `api/crud/report.py`, `api/crud/speech.py`, `api/crud/sitting.py`, `api/crud/attendance.py`, `api/crud/membership.py`, `api/crud/person.py`

**Pattern reference:** kelix `api/crud/user_product_tour.py:L10-L28` (constructor, named `statement`, `.first()` for `Optional`)

Common shape: `class CRUDXxx:` with `def __init__(self, session: Session): self.session = session`. Imports as needed: `from typing import Optional`, `from sqlmodel import Session, select`, `from sqlalchemy import Date, Integer, cast, func`, `from sqlalchemy.orm import defer`. A multi-line statement sits in one pair of parentheses with separate `.where()` calls. A two-column aggregate statement is executed with `self.session.exec(statement).all()` and turned into a dict by a comprehension that unpacks each row into two named locals (`{parliament_number: report_count for parliament_number, report_count in rows}`), which is the loop shape R24(a) allows; the result variable is named `{key}_to_{value}`. A single-value statement uses `.one()`. "Has text" is always the pair `.where(Report.markdown_content.is_not(None)).where(Report.markdown_content != "")`; a count of such rows is `func.count().filter(Report.markdown_content.is_not(None), Report.markdown_content != "")`. Every method is annotated.

`crud/report.py` (`CRUDReport`):

| Method | Statement |
|---|---|
| `get_by_report_id(self, report_id: str) -> Optional[Report]` | `select(Report).where(Report.report_id == report_id)`, `.first()` |
| `get_by_ids(self, report_ids: list[int]) -> list[Report]` | `select(Report).options(defer(Report.markdown_content)).where(Report.id.in_(report_ids))` |
| `get_all_by_sitting_date(self, sitting_date: datetime) -> list[Report]` | same options, `.where(Report.sitting_date == sitting_date).order_by(Report.speech_number)` |
| `get_all_ids_with_text_by_ids(self, report_ids: list[int]) -> list[int]` | `select(Report.id).where(Report.id.in_(report_ids))` plus the has-text pair |
| `get_parliament_number_to_sitting_count(self) -> dict[int, int]` | `select(Report.parliament_number, func.count(func.distinct(Report.sitting_date))).group_by(Report.parliament_number)` |
| `get_parliament_number_to_report_count(self) -> dict[int, int]` | `func.count()` grouped the same way |
| `get_parliament_number_to_text_report_count(self) -> dict[int, int]` | the filtered count grouped the same way |
| `get_parliament_number_to_first_sitting_date(self) -> dict[int, datetime]` | `func.min(Report.sitting_date)` |
| `get_parliament_number_to_last_sitting_date(self) -> dict[int, datetime]` | `func.max(Report.sitting_date)` |
| `get_sitting_date_to_volume_number_by_parliament_number(self, parliament_number: int) -> dict[datetime, int]` | `select(Report.sitting_date, func.max(Report.volume_number)).where(Report.parliament_number == parliament_number).group_by(Report.sitting_date).order_by(Report.sitting_date)` |
| `get_sitting_date_to_sitting_number_by_parliament_number(self, parliament_number: int) -> dict[datetime, Optional[int]]` | `func.max(Report.sitting_number)` |
| `get_sitting_date_to_report_count_by_parliament_number(self, parliament_number: int) -> dict[datetime, int]` | `func.count()` |
| `get_count(self) -> int` | `select(func.count()).select_from(Report)` |
| `get_text_report_count(self) -> int` | same with the has-text pair |
| `get_min_sitting_date_with_text(self) -> Optional[datetime]` | `select(func.min(Report.sitting_date))` with the pair |
| `get_max_sitting_date_with_text(self) -> Optional[datetime]` | `func.max` |
| `get_year_to_report_count(self) -> dict[int, int]` | `year = cast(func.extract("year", Report.sitting_date), Integer)`; `select(year, func.count()).group_by(year).order_by(year)` |
| `get_year_to_text_report_count(self) -> dict[int, int]` | the filtered count grouped by `year` |

`crud/speech.py` (`CRUDSpeech`):

| Method | Statement |
|---|---|
| `get_all_by_report_id(self, report_id: int) -> list[Speech]` | `select(Speech).where(Speech.report_id == report_id).order_by(Speech.ordinal)` |
| `get_parliament_number_to_speech_count_by_membership_ids(self, membership_ids: list[int]) -> dict[int, int]` | `select(Report.parliament_number, func.count()).join(Report, Report.id == Speech.report_id).where(Speech.speaker_id.in_(membership_ids)).group_by(Report.parliament_number)` |
| `get_report_id_to_speech_count_by_membership_ids(self, membership_ids: list[int], limit: int, offset: int) -> dict[int, int]` | `select(Speech.report_id, func.count()).join(Report, Report.id == Speech.report_id).where(Speech.speaker_id.in_(membership_ids)).group_by(Speech.report_id, Report.sitting_date, Report.speech_number).order_by(Report.sitting_date.desc(), Report.speech_number.desc()).limit(limit).offset(offset)`; the comprehension keeps row order, so the dict's key order is the page order |
| `get_count(self) -> int` | `select(func.count()).select_from(Speech)` |
| `get_count_with_membership_id(self) -> int` | `.where(Speech.speaker_id.is_not(None))` |

`crud/sitting.py` (`CRUDSitting`):

| Method | Statement |
|---|---|
| `get_by_sitting_date(self, sitting_date_text: str) -> Optional[Sitting]` | `select(Sitting).where(Sitting.sitting_date == sitting_date_text)`, `.first()` |
| `get_sitting_date_to_session_number_by_sitting_dates(self, sitting_date_texts: list[str]) -> dict[str, Optional[int]]` | `select(Sitting.sitting_date, Sitting.session_no).where(Sitting.sitting_date.in_(sitting_date_texts))` |
| `get_count(self) -> int` | |
| `get_max_sitting_date_with_attendance(self) -> Optional[date]` | `sitting_ids_with_attendance = select(Attendance.sitting_id).distinct().subquery()`; `select(func.max(func.to_date(Sitting.sitting_date, _SITTING_DATE_FORMAT))).join(sitting_ids_with_attendance, sitting_ids_with_attendance.c.sitting_id == Sitting.id)` with `_SITTING_DATE_FORMAT = "DD-MM-YYYY"` |

`crud/attendance.py` (`CRUDAttendance`). The Parliament of an attendance row comes through its sitting's date: `report_dates = select(Report.sitting_date, Report.parliament_number).distinct().subquery()`, joined on `cast(report_dates.c.sitting_date, Date) == func.to_date(Sitting.sitting_date, _SITTING_DATE_FORMAT)`.

| Method | Statement |
|---|---|
| `get_all_by_sitting_id(self, sitting_id: int) -> list[Attendance]` | `.where(Attendance.sitting_id == sitting_id).order_by(Attendance.is_present.desc(), Attendance.speaker_name)` |
| `get_parliament_number_to_present_count_by_membership_ids(self, membership_ids: list[int]) -> dict[int, int]` | `select(report_dates.c.parliament_number, func.count()).join(Sitting, Sitting.id == Attendance.sitting_id).join(report_dates, <date join>).where(Attendance.speaker_id.in_(membership_ids)).where(Attendance.is_present.is_(True)).group_by(report_dates.c.parliament_number)` |
| `get_parliament_number_to_absent_count_by_membership_ids(self, membership_ids: list[int]) -> dict[int, int]` | same with `.is_(False)` |
| `get_membership_id_to_location_names_by_membership_ids(self, membership_ids: list[int]) -> dict[int, list[str]]` | `select(Attendance.speaker_id, Attendance.location_name).where(Attendance.speaker_id.in_(membership_ids)).where(Attendance.location_name.is_not(None)).distinct().order_by(Attendance.speaker_id, Attendance.location_name)`; assign `membership_id_to_location_names: dict[int, list[str]] = {}` first, then loop and `setdefault(...).append(...)` |
| `get_count(self) -> int` | |
| `get_count_with_membership_id(self) -> int` | `.where(Attendance.speaker_id.is_not(None))` |

`crud/membership.py` (`CRUDMembership` over `Speaker`; the file and class use the brief's term, the model keeps the table's name):

| Method | Statement |
|---|---|
| `get_by_ids(self, membership_ids: list[int]) -> list[Speaker]` | |
| `get_all_by_person_id(self, person_id: int) -> list[Speaker]` | `.order_by(Speaker.parliament_number)` |
| `get_all_by_person_ids(self, person_ids: list[int]) -> list[Speaker]` | `.order_by(Speaker.person_id, Speaker.parliament_number)` |
| `get_all_filtered(self, parliament_number: Optional[int], is_legislative_assembly: Optional[bool], party: Optional[str], name: Optional[str]) -> list[Speaker]` | filters list per `crud/CLAUDE.md`; `name` becomes `Speaker.name.ilike(f"%{escape_like_pattern(name)}%", escape="\\")` |
| `get_all_parties(self) -> list[str]` | `select(Speaker.party).distinct().order_by(Speaker.party)` |
| `get_count(self) -> int` | |

`crud/person.py` (`CRUDPerson`): `get(self, person_id: int) -> Optional[Person]`, `get_by_ids(self, person_ids: list[int]) -> list[Person]`, `get_count(self) -> int`.

**Expected state after this commit:**
- [ ] Six `CRUD*` classes exist with the method names above; `grep -n "dataclass" api/crud` finds nothing
- [ ] No `crud/` method raises a domain exception or imports `schemas/`
- [ ] `get_by_ids` and `get_all_by_sitting_date` on `CRUDReport` carry `defer(Report.markdown_content)`
- [ ] `uv run ruff check .` and `uv run ruff format --check .` pass

---

## 6. `docs: port the crud layer conventions`

**Files:** `api/crud/CLAUDE.md`, `api/CLAUDE.md`

**Pattern reference:** kelix `api/crud/CLAUDE.md`, ported per foundation brief decision 2

Write `api/crud/CLAUDE.md` from the kelix file with every Kelix fact removed: the Kelix examples become Hansard names (`CRUDSpeech`, `Speaker`, `Report`), the "Dead Files" section goes, the Kelix live cases go, and a note says this API is read-only so the mutation shapes are kept for a future write path only. Add: a row for the `get_{key}_to_{value}` dict shape; a line that `speech.speaker_id` and `attendance.speaker_id` are Membership foreign keys and are called `membership_id` in every method name and parameter outside `database/` (brief decision 9); a line that list methods over `report` defer `markdown_content`; a line that no class spans two tables and no method returns a tuple or a dataclass (R35). Remove from `api/CLAUDE.md` the sentence "When `crud/` is added, port `api/crud/CLAUDE.md` from kelix-audit with it. It is not ported now."

**Expected state after this commit:**
- [ ] `api/crud/CLAUDE.md` exists; `grep -in "kelix\|azure\|entra\|audit_report\|ingestion" api/crud/CLAUDE.md` finds nothing
- [ ] `api/CLAUDE.md` no longer says the crud guide is unported

---

## 7. `feat: add full-text search methods to the speech and report CRUD`

**Files:** `api/crud/speech.py`, `api/crud/report.py`, `api/crud/text_search.py`, `api/crud/CLAUDE.md`

**Pattern reference:** `api/crud/speech.py` (step 5) for class shape; none for the full-text expressions, introducing new pattern

`crud/text_search.py` holds the shared expression constants used by both classes (a lower-layer home would be `utils/`, but these are SQLAlchemy constructs, not pure functions; two peers sharing a constant from a sibling module in the same layer is a module of constants, not a CRUD class). This step appends the section "Full-text search constants" to `api/crud/CLAUDE.md`: it names the two constants, says both `CRUDSpeech` and `CRUDReport` import them so the expressions match `docs/required-indexes.md` byte for byte, says the configuration is a SQL literal and never a bound parameter, and says the module holds constants only and must not grow a session or a statement. Step 6 writes the file without that section.

```python
from sqlalchemy import literal_column

TEXT_SEARCH_CONFIGURATION = literal_column("'english'")
HEADLINE_OPTIONS = "StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15"
```

Verified on 13 October 2026: `func.to_tsvector(TEXT_SEARCH_CONFIGURATION, Speech.transcript)` compiles to `to_tsvector('english', speech.transcript)`, the form the GIN expression index will match. A plain Python string argument would bind as a parameter and defeat the index.

Add to `CRUDSpeech`:

```python
def get_all_by_query_filtered(
    self,
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[str],
    membership_ids: Optional[list[int]],
    sort: SearchSort,
    limit: int,
    offset: int,
) -> list[Speech]:
    tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
    transcript_vector = func.to_tsvector(TEXT_SEARCH_CONFIGURATION, Speech.transcript)
    rank = func.ts_rank(transcript_vector, tsquery)
    filters = [transcript_vector.op("@@")(tsquery)]
    if parliament_number is not None:
        filters.append(Report.parliament_number == parliament_number)
    if date_from is not None:
        filters.append(Report.sitting_date >= date_from)
    if date_to is not None:
        filters.append(Report.sitting_date < date_to + _ONE_DAY)
    if report_type is not None:
        filters.append(Report.report_type == report_type)
    if membership_ids is not None:
        filters.append(Speech.speaker_id.in_(membership_ids))
    ordering = _get_speech_ordering(sort, rank)
    statement = (
        select(Speech)
        .join(Report, Report.id == Speech.report_id)
        .where(*filters)
        .order_by(*ordering)
        .limit(limit)
        .offset(offset)
    )
    return list(self.session.exec(statement).all())


def get_id_to_headline_by_ids(self, speech_ids: list[int], query: str) -> dict[int, str]:
    tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
    statement = select(
        Speech.id,
        func.ts_headline(TEXT_SEARCH_CONFIGURATION, Speech.transcript, tsquery, HEADLINE_OPTIONS),
    ).where(Speech.id.in_(speech_ids))
    ...
```

with module-level `_ONE_DAY = timedelta(days=1)` and a private helper above the class:

```python
def _get_speech_ordering(sort: SearchSort, rank: ColumnElement) -> tuple[ColumnElement, ...]:
    if sort == SearchSort.DATE:
        return (Report.sitting_date.desc(), rank.desc(), Speech.id)
    return (rank.desc(), Report.sitting_date.desc(), Speech.id)
```

Add to `CRUDReport` the same pair over `Report.title`: `get_all_by_title_query_filtered(self, query, parliament_number, date_from, date_to, report_type, is_text_available: Optional[bool], sort, limit, offset) -> list[Report]` (the `is_text_available` filter: `True` adds the has-text pair; `False` adds `or_(Report.markdown_content.is_(None), Report.markdown_content == "")`; `None` adds nothing), ordering by `(rank.desc(), Report.sitting_date.desc(), Report.id)` or date first, with `defer(Report.markdown_content)`; and `get_id_to_title_headline_by_ids(self, report_ids: list[int], query: str) -> dict[int, str]`.

`sitting_date` compares to a `date` correctly because every stored value is midnight.

**Expected state after this commit:**
- [ ] `TEXT_SEARCH_CONFIGURATION` and `HEADLINE_OPTIONS` exist in `api/crud/text_search.py`; `grep -rn --include="*.py" "'english'" api/crud` finds only that file
- [ ] The four methods exist; `ts_headline` appears only in the two `get_id_to_*headline_by_ids` methods
- [ ] `uv run ruff check .` passes

---

## 8. `feat: add the membership to person lookup`

**Files:** `api/middleware/__init__.py`, `api/middleware/membership.py`

**Pattern reference:** none, introducing new pattern (`api/CLAUDE.md` `middleware/` row; R23 and R29 put a concern composed from two tables for several services here)

```python
from sqlmodel import Session

from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from database.person import Person


def get_membership_id_to_person(membership_ids: list[int], session: Session) -> dict[int, Person]:
    memberships = CRUDMembership(session).get_by_ids(membership_ids)
    person_ids = [membership.person_id for membership in memberships if membership.person_id is not None]
    person_id_to_person = {person.id: person for person in CRUDPerson(session).get_by_ids(person_ids)}
    return {
        membership.id: person_id_to_person[membership.person_id]
        for membership in memberships
        if membership.person_id in person_id_to_person
    }
```

**Expected state after this commit:**
- [ ] `get_membership_id_to_person` exists in `api/middleware/membership.py` and imports nothing from `services/`
- [ ] `uv run ruff check .` passes

---

## 9. `feat: add the response schemas`

**Files:** `api/schemas/__init__.py`, `api/schemas/report.py`, `api/schemas/sitting.py`, `api/schemas/parliament.py`, `api/schemas/person.py`, `api/schemas/search.py`, `api/schemas/coverage.py`

**Pattern reference:** kelix `api/schemas/eula.py:L1-L5` (`BaseModel`, no defaults)

All `from pydantic import BaseModel`, dates as `datetime.date`, no defaults, `Optional` only where marked.

```python
# schemas/report.py
class SpeechData(BaseModel):
    ordinal: int
    speaker_label: str
    transcript: str
    person_id: Optional[int]
    person_slug: str
    person_name: str

class GetReportResponse(BaseModel):
    report_slug: str
    title: str
    subtitle: str
    report_type: str
    parliament_number: int
    volume_number: int
    sitting_number: Optional[int]
    sitting_date: date
    official_record_url: str
    is_text_available: bool
    speeches: list[SpeechData]

# schemas/sitting.py
class SittingReportData(BaseModel):
    report_slug: str
    title: str
    subtitle: str
    report_type: str
    speech_number: int
    is_text_available: bool

class AttendanceData(BaseModel):
    name: str
    is_present: bool
    constituency: str
    person_id: Optional[int]
    person_slug: str
    person_name: str

class GetSittingResponse(BaseModel):
    sitting_date: date
    parliament_number: int
    volume_number: int
    sitting_number: Optional[int]
    session_number: Optional[int]
    reports: list[SittingReportData]
    is_attendance_available: bool
    attendance: list[AttendanceData]

class SittingData(BaseModel):
    sitting_date: date
    parliament_number: int
    volume_number: int
    sitting_number: Optional[int]
    session_number: Optional[int]
    report_count: int

class GetAllSittingsResponse(BaseModel):
    sittings: list[SittingData]

# schemas/parliament.py
class ParliamentData(BaseModel):
    parliament_number: int
    sitting_count: int
    report_count: int
    text_report_count: int
    first_sitting_date: date
    last_sitting_date: date

class GetAllParliamentsResponse(BaseModel):
    parliaments: list[ParliamentData]

# schemas/person.py
class MembershipData(BaseModel):
    parliament_number: int
    party: str
    is_legislative_assembly: bool
    is_member: bool

class PersonData(BaseModel):
    person_id: int
    person_slug: str
    canonical_name: str
    memberships: list[MembershipData]

class GetAllPersonsResponse(BaseModel):
    persons: list[PersonData]

class PersonMembershipData(BaseModel):
    parliament_number: int
    party: str
    is_legislative_assembly: bool
    is_member: bool
    constituencies: list[str]

class ParliamentCountData(BaseModel):
    parliament_number: int
    speech_count: int
    present_count: int
    absent_count: int

class GetPersonResponse(BaseModel):
    person_id: int
    person_slug: str
    canonical_name: str
    name_variants: list[str]
    memberships: list[PersonMembershipData]
    parliament_counts: list[ParliamentCountData]

class PersonReportData(BaseModel):
    report_slug: str
    title: str
    subtitle: str
    report_type: str
    sitting_date: date
    parliament_number: int
    speech_count: int

class GetPersonReportsResponse(BaseModel):
    reports: list[PersonReportData]
    page: int
    page_size: int
    has_next_page: bool

class GetAllPartiesResponse(BaseModel):
    parties: list[str]

# schemas/search.py
class SpeechMatchData(BaseModel):
    report_slug: str
    title: str
    report_type: str
    sitting_date: date
    parliament_number: int
    ordinal: int
    speaker_label: str
    person_id: Optional[int]
    person_slug: str
    person_name: str
    snippet: str

class SearchSpeechesResponse(BaseModel):
    results: list[SpeechMatchData]
    page: int
    page_size: int
    has_next_page: bool

class ReportMatchData(BaseModel):
    report_slug: str
    title: str
    report_type: str
    sitting_date: date
    parliament_number: int
    is_text_available: bool
    snippet: str

class SearchReportsResponse(BaseModel):
    results: list[ReportMatchData]
    page: int
    page_size: int
    has_next_page: bool

# schemas/coverage.py
class YearCoverageData(BaseModel):
    year: int
    report_count: int
    text_report_count: int

class GetCoverageResponse(BaseModel):
    report_count: int
    text_report_count: int
    speech_count: int
    linked_speech_count: int
    person_count: int
    membership_count: int
    sitting_count: int
    attendance_count: int
    linked_attendance_count: int
    text_first_sitting_date: Optional[date]
    text_last_sitting_date: Optional[date]
    attendance_last_sitting_date: Optional[date]
    years: list[YearCoverageData]
```

**Expected state after this commit:**
- [ ] Every class above exists in its file; `grep -rn "= None\|= \"\"\|= \[\]" api/schemas/` finds nothing
- [ ] `uv run ruff check .` passes

---

## 10. `feat: add the report endpoint`

**Files:** `api/services/__init__.py`, `api/services/report.py`, `api/routers/report.py`, `api/main.py`

**Pattern reference:**
- `api/services/report.py` → kelix `api/services/eula.py:L1-L13`
- `api/routers/report.py` → kelix `api/routers/eula.py:L1-L20` without `EndpointLogLevel`, `RateLimiter` and auth (none exist here); `api/routers/health.py:L7-L13`

```python
# services/report.py
from sqlmodel import Session

from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.person import Person
from database.report import Report
from database.speech import Speech
from exceptions.report import ReportNotFoundException
from middleware.membership import get_membership_id_to_person
from schemas.report import GetReportResponse, SpeechData
from utils.official_record import get_official_record_url
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is not None:
            return report
    raise ReportNotFoundException


def _is_text_available(markdown_content: Optional[str]) -> bool:
    return markdown_content is not None and markdown_content != ""


def _build_speech_data(speech: Speech, membership_id_to_person: dict[int, Person]) -> SpeechData:
    person = membership_id_to_person.get(speech.speaker_id) if speech.speaker_id is not None else None
    if person is None:
        return SpeechData(ordinal=speech.ordinal, speaker_label=speech.speaker or "", transcript=speech.transcript,
                          person_id=None, person_slug="", person_name="")
    return SpeechData(ordinal=speech.ordinal, speaker_label=speech.speaker or "", transcript=speech.transcript,
                      person_id=person.id, person_slug=get_person_slug(person.canonical_name), person_name=person.canonical_name)


def get_report(report_slug: str, session: Session) -> GetReportResponse:
    report = _get_validated_report(report_slug, session)
    speeches = CRUDSpeech(session).get_all_by_report_id(report.id)
    membership_ids = sorted({speech.speaker_id for speech in speeches if speech.speaker_id is not None})
    membership_id_to_person = get_membership_id_to_person(membership_ids, session)
    return GetReportResponse(
        report_slug=get_report_slug(report.report_id),
        title=report.title,
        subtitle=report.subtitle or "",
        report_type=report.report_type,
        parliament_number=report.parliament_number,
        volume_number=report.volume_number,
        sitting_number=report.sitting_number,
        sitting_date=report.sitting_date.date(),
        official_record_url=get_official_record_url(report.report_id, report.report_version, report.html_file_name),
        is_text_available=_is_text_available(report.markdown_content),
        speeches=[_build_speech_data(speech, membership_id_to_person) for speech in speeches],
    )
```

`_is_text_available` belongs in `utils/` if a second service needs it (the sitting service uses the ids method instead, so it stays local). The `.get(...) if ... else None` conditional avoids an R33 reassignment.

```python
# routers/report.py
from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.engine import get_session
from schemas.report import GetReportResponse
from services import report as report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{report_slug}", status_code=200)
def get_report(report_slug: str, session: Session = Depends(get_session)) -> GetReportResponse:
    return report_service.get_report(report_slug, session)
```

The app sends `%23` for an inner `#`; Starlette decodes it before matching, and a slug never contains `/`. In `main.py`: `from routers import health, report` and `app.include_router(report.router)`.

**Expected state after this commit:**
- [ ] `services/report.py::get_report` and `_get_validated_report` exist; `routers/report.py` registers `GET /reports/{report_slug}`; `main.py` includes it
- [ ] `uv run ruff check .` passes

---

## 11. `feat: add the sitting and parliament endpoints`

**Files:** `api/services/sitting.py`, `api/services/parliament.py`, `api/routers/sitting.py`, `api/routers/parliament.py`, `api/main.py`

**Pattern reference:** step 10

`services/sitting.py`:

```python
def _get_validated_sitting(sitting_date: date, session: Session) -> Sitting:
    sitting = CRUDSitting(session).get_by_sitting_date(get_sitting_date_text(sitting_date))
    if sitting is None:
        raise SittingNotFoundException
    return sitting


def _get_validated_reports(sitting_date: date, session: Session) -> list[Report]:
    reports = CRUDReport(session).get_all_by_sitting_date(datetime.combine(sitting_date, time.min))
    if not reports:
        raise SittingNotFoundException
    return reports


def _build_attendance_data(attendance: Attendance, membership_id_to_person: dict[int, Person]) -> AttendanceData:
    # name=attendance.speaker_name or "", is_present=bool(attendance.is_present),
    # constituency=attendance.location_name or "", person fields as in step 10


def get_sitting(sitting_date: date, session: Session) -> GetSittingResponse:
    sitting = _get_validated_sitting(sitting_date, session)
    reports = _get_validated_reports(sitting_date, session)
    report_ids_with_text = set(CRUDReport(session).get_all_ids_with_text_by_ids([report.id for report in reports]))
    attendances = CRUDAttendance(session).get_all_by_sitting_id(sitting.id)
    membership_ids = sorted({attendance.speaker_id for attendance in attendances if attendance.speaker_id is not None})
    membership_id_to_person = get_membership_id_to_person(membership_ids, session)
    sitting_numbers = [report.sitting_number for report in reports if report.sitting_number is not None]
    return GetSittingResponse(
        sitting_date=sitting_date,
        parliament_number=reports[0].parliament_number,
        volume_number=reports[0].volume_number,
        sitting_number=max(sitting_numbers, default=None),
        session_number=sitting.session_no,
        reports=[SittingReportData(report_slug=get_report_slug(report.report_id), title=report.title,
                                   subtitle=report.subtitle or "", report_type=report.report_type,
                                   speech_number=report.speech_number,
                                   is_text_available=report.id in report_ids_with_text) for report in reports],
        is_attendance_available=len(attendances) > 0,
        attendance=[_build_attendance_data(attendance, membership_id_to_person) for attendance in attendances],
    )


def get_all_sittings(parliament_number: int, session: Session) -> GetAllSittingsResponse:
    sitting_date_to_volume_number = CRUDReport(session).get_sitting_date_to_volume_number_by_parliament_number(parliament_number)
    sitting_date_to_sitting_number = CRUDReport(session).get_sitting_date_to_sitting_number_by_parliament_number(parliament_number)
    sitting_date_to_report_count = CRUDReport(session).get_sitting_date_to_report_count_by_parliament_number(parliament_number)
    sitting_date_texts = [get_sitting_date_text(sitting_date.date()) for sitting_date in sitting_date_to_volume_number]
    sitting_date_text_to_session_number = CRUDSitting(session).get_sitting_date_to_session_number_by_sitting_dates(sitting_date_texts)
    sittings = [
        SittingData(
            sitting_date=sitting_date.date(),
            parliament_number=parliament_number,
            volume_number=volume_number,
            sitting_number=sitting_date_to_sitting_number[sitting_date],
            session_number=sitting_date_text_to_session_number.get(get_sitting_date_text(sitting_date.date())),
            report_count=sitting_date_to_report_count[sitting_date],
        )
        for sitting_date, volume_number in sitting_date_to_volume_number.items()
    ]
    return GetAllSittingsResponse(sittings=sittings)
```

`services/parliament.py::get_all_parliaments(session) -> GetAllParliamentsResponse` reads the five `get_parliament_number_to_*` dicts and builds one `ParliamentData` per key of the report-count dict, in ascending key order, with `.date()` on the two dates.

Routers: `routers/sitting.py` with `prefix="/sittings"`: `GET ""` taking `parliament_number: int = Query(ge=0)` and `GET "/{sitting_date}"` taking `sitting_date: date`; the literal route is registered first. `routers/parliament.py` with `prefix="/parliaments"`: `GET ""`. `main.py` includes both.

**Expected state after this commit:**
- [ ] `get_sitting`, `get_all_sittings`, `get_all_parliaments` exist; `GET /sittings`, `GET /sittings/{sitting_date}`, `GET /parliaments` are registered
- [ ] `uv run ruff check .` passes

---

## 12. `feat: add the people and parties endpoints`

**Files:** `api/services/person.py`, `api/routers/person.py`, `api/routers/party.py`, `api/main.py`

**Pattern reference:** steps 10 and 11

```python
_LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0


def _get_validated_person(person_id: int, session: Session) -> Person


def get_all_persons(parliament_number: Optional[int], party: Optional[str], name: Optional[str], session: Session) -> GetAllPersonsResponse:
    if parliament_number == _LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER:
        matching_memberships = CRUDMembership(session).get_all_filtered(None, True, party, name)
    else:
        matching_memberships = CRUDMembership(session).get_all_filtered(parliament_number, None, party, name)
```

That `if`/`else` assigns in both branches, which R33 does not reach (nothing is pre-assigned and reassigned), but to keep the no-`else` shape write it as two early returns through a helper `_get_matching_memberships(parliament_number, party, name, session) -> list[Speaker]` with `if parliament_number == _LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER: return ...` then `return ...`. Then:

```python
    person_ids = sorted({membership.person_id for membership in matching_memberships if membership.person_id is not None})
    persons = CRUDPerson(session).get_by_ids(person_ids)
    memberships = CRUDMembership(session).get_all_by_person_ids(person_ids)
    person_id_to_memberships: dict[int, list[Speaker]] = {}
    for membership in memberships:
        person_id_to_memberships.setdefault(membership.person_id, []).append(membership)
    # PersonData per person sorted by canonical_name, memberships mapped to MembershipData


def get_person(person_id: int, session: Session) -> GetPersonResponse:
    person = _get_validated_person(person_id, session)
    memberships = CRUDMembership(session).get_all_by_person_id(person_id)
    membership_ids = [membership.id for membership in memberships]
    membership_id_to_location_names = CRUDAttendance(session).get_membership_id_to_location_names_by_membership_ids(membership_ids)
    parliament_number_to_speech_count = CRUDSpeech(session).get_parliament_number_to_speech_count_by_membership_ids(membership_ids)
    parliament_number_to_present_count = CRUDAttendance(session).get_parliament_number_to_present_count_by_membership_ids(membership_ids)
    parliament_number_to_absent_count = CRUDAttendance(session).get_parliament_number_to_absent_count_by_membership_ids(membership_ids)
    parliament_numbers = sorted(set(parliament_number_to_speech_count) | set(parliament_number_to_present_count) | set(parliament_number_to_absent_count))
    name_variants = sorted({membership.name for membership in memberships if membership.name != person.canonical_name})
    # memberships → PersonMembershipData with constituencies=membership_id_to_location_names.get(id, [])
    # parliament_counts → ParliamentCountData per parliament_numbers with .get(n, 0)


def get_person_reports(person_id: int, page: int, page_size: int, session: Session) -> GetPersonReportsResponse:
    person = _get_validated_person(person_id, session)
    membership_ids = [membership.id for membership in CRUDMembership(session).get_all_by_person_id(person.id)]
    report_id_to_speech_count = CRUDSpeech(session).get_report_id_to_speech_count_by_membership_ids(
        membership_ids, limit=page_size + 1, offset=(page - 1) * page_size)
    page_report_ids = list(report_id_to_speech_count)[:page_size]
    report_id_to_report = {report.id: report for report in CRUDReport(session).get_by_ids(page_report_ids)}
    # PersonReportData in page_report_ids order; has_next_page = len(report_id_to_speech_count) > page_size


def get_all_parties(session: Session) -> GetAllPartiesResponse
```

A Person with memberships but no linked rows gets an empty `parliament_counts`, not zeros; the app says so.

Routers: `routers/person.py`, `prefix="/people"`: `GET ""` (`parliament_number: Optional[int] = Query(default=None, ge=0)`, `party: Optional[str] = Query(default=None, min_length=1)`, `name: Optional[str] = Query(default=None, min_length=1)`), `GET "/{person_id}"`, `GET "/{person_id}/reports"` (`page: int = Query(default=1, ge=1)`, `page_size: int = Query(default=_DEFAULT_PAGE_SIZE, ge=1, le=_MAX_PAGE_SIZE)`); `routers/party.py`, `prefix="/parties"`: `GET ""`. `_DEFAULT_PAGE_SIZE = 20` and `_MAX_PAGE_SIZE = 100` are module-level in each router that pages. `main.py` includes both routers.

**Expected state after this commit:**
- [ ] `get_all_persons`, `get_person`, `get_person_reports`, `get_all_parties` exist in `services/person.py`
- [ ] `GET /people`, `GET /people/{person_id}`, `GET /people/{person_id}/reports`, `GET /parties` registered
- [ ] `uv run ruff check .` passes

---

## 13. `feat: add the search endpoints`

**Files:** `api/services/search.py`, `api/routers/search.py`, `api/main.py`

**Pattern reference:** step 12 for paging

```python
def _get_membership_ids(person_id: Optional[int], session: Session) -> Optional[list[int]]:
    if person_id is None:
        return None
    return [membership.id for membership in CRUDMembership(session).get_all_by_person_id(person_id)]


def _get_title_text_availability(person_id: Optional[int]) -> Optional[bool]:
    if person_id is None:
        return None
    return False


def search_speeches(query, parliament_number, date_from, date_to, report_type: Optional[ReportType], person_id, sort, page, page_size, session) -> SearchSpeechesResponse:
    membership_ids = _get_membership_ids(person_id, session)
    speeches = CRUDSpeech(session).get_all_by_query_filtered(query, parliament_number, date_from, date_to,
        report_type.value if report_type is not None else None, membership_ids, sort, limit=page_size + 1, offset=(page - 1) * page_size)
    page_speeches = speeches[:page_size]
    speech_id_to_headline = CRUDSpeech(session).get_id_to_headline_by_ids([speech.id for speech in page_speeches], query)
    report_id_to_report = {report.id: report for report in CRUDReport(session).get_by_ids(sorted({speech.report_id for speech in page_speeches}))}
    membership_id_to_person = get_membership_id_to_person(sorted({speech.speaker_id for speech in page_speeches if speech.speaker_id is not None}), session)
    # SpeechMatchData per page speech; has_next_page = len(speeches) > page_size


def search_reports(query, parliament_number, date_from, date_to, report_type, person_id, sort, page, page_size, session) -> SearchReportsResponse:
    reports = CRUDReport(session).get_all_by_title_query_filtered(query, parliament_number, date_from, date_to,
        report_type.value if report_type is not None else None, _get_title_text_availability(person_id), sort, limit=page_size + 1, offset=(page - 1) * page_size)
    page_reports = reports[:page_size]
    report_id_to_headline = CRUDReport(session).get_id_to_title_headline_by_ids([report.id for report in page_reports], query)
    report_ids_with_text = set(CRUDReport(session).get_all_ids_with_text_by_ids([report.id for report in page_reports]))
    # ReportMatchData per page report
```

A Person with no memberships gives `membership_ids == []`, which the speech query filters to nothing: correct.

Router `routers/search.py`, `prefix="/search"`, two handlers `GET "/speeches"` and `GET "/reports"` sharing the same query parameters: `query: str = Query(alias="q", min_length=1, max_length=_MAX_QUERY_LENGTH)` with `_MAX_QUERY_LENGTH = 200`, `parliament_number: Optional[int] = Query(default=None, ge=0)`, `date_from: Optional[date] = None`, `date_to: Optional[date] = None`, `report_type: Optional[ReportType] = None`, `person_id: Optional[int] = Query(default=None, ge=1)`, `sort: SearchSort = SearchSort.RELEVANCE`, `page`, `page_size` as step 12. Router function names match the service names.

**Expected state after this commit:**
- [ ] `search_speeches` and `search_reports` exist; `GET /search/speeches` and `GET /search/reports` registered
- [ ] `uv run ruff check .` passes

---

## 14. `feat: add the coverage endpoint`

**Files:** `api/services/coverage.py`, `api/routers/coverage.py`, `api/main.py`

**Pattern reference:** step 11

`get_coverage(session) -> GetCoverageResponse` calls `CRUDReport.get_count`, `get_text_report_count`, `get_min_sitting_date_with_text`, `get_max_sitting_date_with_text`, `get_year_to_report_count`, `get_year_to_text_report_count`; `CRUDSpeech.get_count`, `get_count_with_membership_id`; `CRUDPerson.get_count`; `CRUDMembership.get_count`; `CRUDSitting.get_count`, `get_max_sitting_date_with_attendance`; `CRUDAttendance.get_count`, `get_count_with_membership_id`. Years come from the report-count dict's keys in ascending order with `.get(year, 0)` on the text dict. Dates map through `.date()` where they are datetimes (`get_max_sitting_date_with_attendance` already returns a `date`). Router `prefix="/coverage"`, `GET ""`.

**Expected state after this commit:**
- [ ] `GET /coverage` registered; `uv run ruff check .` passes

---

## 15. `docs: list the indexes the API needs`

**Files:** `docs/required-indexes.md`

**Pattern reference:** none, introducing new pattern (brief decision 16 fixes the content)

Sections: an intro (why the list exists, ADR 0003, "slow sequential scans are acceptable in local development", "the API does not launch until every listed index exists", "B1 and B2 are unverified until the two GIN indexes exist"), then one section per index with the exact DDL, the endpoints that need it, the SQL the API sends (captured by compiling the SQLModel statement with the Postgres dialect), and the `EXPLAIN` output from a read-only run against today's database:

1. `CREATE INDEX ix_speech_report_id ON speech (report_id);` for `GET /reports/{report_slug}`, `GET /search/speeches` (join), `GET /people/{person_id}/reports`.
2. `CREATE INDEX ix_speech_speaker_id ON speech (speaker_id);` for `GET /people/{person_id}`, `GET /people/{person_id}/reports`, `GET /search/speeches` with `person_id`.
3. `CREATE INDEX ix_attendance_sitting_id ON attendance (sitting_id);` for `GET /sittings/{sitting_date}`.
4. `CREATE INDEX ix_attendance_speaker_id ON attendance (speaker_id);` for `GET /people/{person_id}`.
5. `CREATE INDEX ix_report_sitting_date ON report (sitting_date);` for `GET /sittings/{sitting_date}`, `GET /sittings`, the search date filters.
6. `CREATE INDEX ix_speech_transcript_fts ON speech USING gin (to_tsvector('english', transcript));` for `GET /search/speeches` (B1, B2). The configuration is `english`, named explicitly because the database default is `simple`.
7. `CREATE INDEX ix_report_title_fts ON report USING gin (to_tsvector('english', title));` for `GET /search/reports` (B1).

Closing sections: ranking cost (`ts_rank` recomputes the vector per matched row; a stored generated `tsvector` column with a GIN index on it is the alternative, and would change the API's expression to the column name); queries the GIN index cannot serve (a negation-only `websearch_to_tsquery`, whose `querytree` is `T`); what is deliberately not indexed (`sitting`, 1,719 rows; `report.report_id`, already unique-indexed; `speaker.person_id`, already indexed).

**Expected state after this commit:**
- [ ] `docs/required-indexes.md` has seven `CREATE INDEX` statements and seven `EXPLAIN` blocks; `grep -c "EXPLAIN ANALYZE" docs/required-indexes.md` is 0

---

## 16. `docs: describe the API layers that now exist`

**Files:** `api/CLAUDE.md`

**Pattern reference:** `api/CLAUDE.md:L45-L82`

Replace "What exists today" with the full list (`main.py`, `settings.py`, `enums.py`, `database/`, `exceptions/`, `utils/`, `crud/`, `middleware/membership.py`, `schemas/`, `services/`, `routers/`), drop "(not yet added)" from the rows that now exist, keep `gateway/` and `validators/` as not yet added, add that `docs/required-indexes.md` is the launch gate for indexes, and note `database/engine.py`'s `get_session` and the read-only and timeout connection options. Add the terminology line: a Membership is never called a speaker outside `database/`.

**Expected state after this commit:**
- [ ] `grep -c "not yet added" api/CLAUDE.md` is 2

---

## 17. `feat: add the tag badge variant`

**Files:** `app/src/components/ui/badge.tsx`, `app/src/components/design/SectionData.tsx`

**Pattern reference:** `app/src/components/ui/badge.tsx:L6-L28`, `app/src/components/design/SectionData.tsx:L158-L166`

Add `tag: 'border-tag-border bg-tag text-tag-foreground'` to the badge variants and `'tag'` to `BADGE_VARIANTS`.

**Expected state after this commit:**
- [ ] `grep -n "tag:" app/src/components/ui/badge.tsx` finds the variant; `BADGE_VARIANTS` includes `'tag'`
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 18. `feat: add report, search and coverage constants`

**Files:** `app/src/constants/constants.ts`, `app/src/constants/reports/enums.ts`, `app/src/constants/reports/constants.ts`, `app/src/constants/search/enums.ts`, `app/src/constants/search/constants.ts`, `app/src/constants/coverage/constants.ts`

**Pattern reference:** `app/src/constants/palette/enums.ts` and `constants.ts`

```ts
// constants/reports/enums.ts: enum ReportType with the 23 members of step 2, SCREAMING_SNAKE_CASE keys, stored strings as values

// constants/reports/constants.ts
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.ORAL_ANSWER]: 'Oral answer',
  [ReportType.WRITTEN_ANSWER]: 'Written answer',
  [ReportType.WRITTEN_ANSWER_NA]: 'Written answer not available',
  [ReportType.CLARIFICATION]: 'Clarification',
  [ReportType.MOTION]: 'Motion',
  [ReportType.MATTER_ADJ]: 'Adjournment matter',
  [ReportType.BILL]: 'Bill',
  [ReportType.BILL_INTRO]: 'Bill introduction',
  [ReportType.MINISTERIAL_STATEMENT]: 'Ministerial statement',
  [ReportType.WRITTEN_STATEMENT]: 'Written statement',
  [ReportType.BUDGET]: 'Budget',
  [ReportType.SPEAKER]: "Presiding officer's statement",
  [ReportType.DEPUTY_SPEAKER]: "Deputy Speaker's statement",
  [ReportType.PERSONAL_EXPLANATION]: 'Personal explanation',
  [ReportType.POINT_OF_ORDER]: 'Point of order',
  [ReportType.TRIBUTE]: 'Tribute',
  [ReportType.PRESIDENT_ADDRESS]: "President's address",
  [ReportType.PETITION]: 'Petition',
  [ReportType.ADMIN_OATHS]: 'Administration of oaths',
  [ReportType.OBITUARY_SPEECH]: 'Obituary speech',
  [ReportType.YANG_DI_MESSAGE]: 'Message from the Yang di-Pertuan Negara',
  [ReportType.MISC]: 'Miscellaneous',
  [ReportType.ATBP]: 'Assent to Bills passed',
}
export const REPORT_TYPE_DROPDOWN_OPTIONS = Object.values(ReportType).map((value) => ({ value, label: REPORT_TYPE_LABELS[value] }))
export const LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0
export const LEGISLATIVE_ASSEMBLY_LABEL = 'Legislative Assembly'
export const LATEST_MEMBERSHIP_PARLIAMENT_NUMBER = 15
export const TEXT_NOT_IN_ARCHIVE_LABEL = 'Text not in this archive yet'

// constants/search/enums.ts
export enum SearchSort { RELEVANCE = 'relevance', DATE = 'date' }

// constants/search/constants.ts
export const SEARCH_SORT_DROPDOWN_OPTIONS = [
  { value: SearchSort.RELEVANCE, label: 'Relevance' },
  { value: SearchSort.DATE, label: 'Newest first' },
]
export const SNIPPET_MARK_START = '<mark>'
export const SNIPPET_MARK_END = '</mark>'
export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

// constants/coverage/constants.ts
export const ATTRIBUTION_MEASURED_ON = '2026-10-13'
export const ATTRIBUTION_SCOPE = 'Parliaments 0 to 11 (the Legislative Assembly to 2011)'
export const ATTRIBUTION_FIGURES = [
  { label: 'Speeches with a name that are linked to a person', value: '97.61%', detail: '564,509 of 578,359 speech rows with a speaker name, leaving out collective "hon. Member" references and stage directions.' },
  { label: 'All speeches that are linked to a person', value: '90.42%', detail: '564,509 of 624,332 speech rows, counting rows with no speaker name at all.' },
  { label: 'Share of the text that sits under a linked speech', value: '96.81%', detail: 'Characters of body text in a linked speech, out of every report with text, including reports that produced no speech rows.' },
] as const
export const KNOWN_GAPS = [
  'No report text from 10 September 2012 onward. Reports from then on have their title and details only.',
  'Parliament 15 is not in the archive.',
  'No attendance lists after 13 August 2012.',
  'Memberships of the Legislative Assembly (1955 to 1965) are filed under Parliament 1, so a person page counts Assembly speeches and attendance under the Legislative Assembly heading but lists the membership as Parliament 1.',
  'About 1,700 reports fetched in October 2026 carry a position number that restarts each month, so their order within a sitting can be wrong.',
  'Column numbers are not shown yet. Citations omit the column until the archive has it.',
  "A person's page address can change when the archive corrects who is who. Report and sitting addresses do not change.",
  'Links to individual speeches (#s1, #s2 and so on) are best-effort. A re-parse can renumber the speeches in a report.',
  'Party names are shown exactly as stored, including two spellings of People\'s Action Party and placeholder values such as "Unknown".',
  'Some budget and President\'s address titles show garbled characters such as "â€™".',
  'Speeches labelled "The Chairman" cannot be linked to a person, because the report does not name the chair.',
] as const

// constants/constants.ts
export const OFFICIAL_RECORD_SEARCH_URL = 'https://sprs.parl.gov.sg/search/'
```

**Expected state after this commit:**
- [ ] The six files exist with the exports above; `ReportType` has 23 members
- [ ] `pnpm build` passes

---

## 19. `feat: add date, citation and transcript helpers`

**Files:** `app/src/lib/format.ts`, `app/src/lib/citation.ts`, `app/src/lib/transcript.ts`, `app/src/lib/utils.ts`, `app/src/constants/constants.ts`, `app/src/main.tsx`

**Pattern reference:** `app/src/lib/colour.ts` (pure module of exported functions); `app/src/main.tsx:L10` (`new QueryClient()`)

```ts
// lib/format.ts
import { format, parseISO } from 'date-fns'
import { LEGISLATIVE_ASSEMBLY_LABEL, LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER } from '@/constants/reports/constants'

const SITTING_DATE_FORMAT = 'd MMMM yyyy'

export function formatSittingDate(sittingDate: string): string {
  return format(parseISO(sittingDate), SITTING_DATE_FORMAT)
}

export function formatParliament(parliamentNumber: number): string {
  return parliamentNumber === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER ? LEGISLATIVE_ASSEMBLY_LABEL : `Parliament ${parliamentNumber}`
}
```

```ts
// lib/citation.ts
export interface SpeakerAttribution { name: string; office: string }

const OFFICE_LABEL_PREFIX = 'The '
const FIRST_BRACKET = /\(([^)]*)\)/
const NAME_DOT = /\./g
const PARLIAMENT_CITATION_TITLE = 'Singapore Parliamentary Debates, Official Report'
const LEGISLATIVE_ASSEMBLY_CITATION_TITLE = 'Singapore Legislative Assembly Debates, Official Report'

export function parseSpeakerLabel(speakerLabel: string): SpeakerAttribution {
  const bracket = speakerLabel.match(FIRST_BRACKET)
  const head = (bracket ? speakerLabel.slice(0, bracket.index) : speakerLabel).trim()
  const isOffice = speakerLabel.startsWith(OFFICE_LABEL_PREFIX)
  const office = isOffice ? head.slice(OFFICE_LABEL_PREFIX.length) : ''
  if (isOffice && bracket) return { name: bracket[1].replace(NAME_DOT, '').trim(), office }
  if (isOffice) return { name: '', office }
  return { name: head.replace(NAME_DOT, ''), office: '' }
}

function getCitationTitle(parliamentNumber: number): string {
  return parliamentNumber === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER ? LEGISLATIVE_ASSEMBLY_CITATION_TITLE : PARLIAMENT_CITATION_TITLE
}

export function buildReportCitation(sittingDate: string, volumeNumber: number, parliamentNumber: number): string {
  return `${getCitationTitle(parliamentNumber)} (${formatSittingDate(sittingDate)}) vol ${volumeNumber}`
}

export function buildSpeechCitation(sittingDate: string, volumeNumber: number, parliamentNumber: number, speakerLabel: string): string {
  const { name, office } = parseSpeakerLabel(speakerLabel)
  const attribution = [name, office].filter((part) => part !== '').join(', ')
  return `${buildReportCitation(sittingDate, volumeNumber, parliamentNumber)} (${attribution})`
}
```

Worked examples the executor checks by reading the code:

| Label | `name` | `office` | Citation bracket |
|---|---|---|---|
| `The Minister for Law (Prof. S. Jayakumar)` | `Prof S Jayakumar` | `Minister for Law` | `(Prof S Jayakumar, Minister for Law)` |
| `The Minister for Education (Mr Tharman Shanmugaratnam) (for the Senior Minister)` | `Mr Tharman Shanmugaratnam` | `Minister for Education` | `(Mr Tharman Shanmugaratnam, Minister for Education)` |
| `Mr Chiam See Tong (Potong Pasir)` | `Mr Chiam See Tong` | `` | `(Mr Chiam See Tong)` |
| `The Prime Minister` | `` | `Prime Minister` | `(Prime Minister)` |
| `Mr Speaker` | `Mr Speaker` | `` | `(Mr Speaker)` |
| `Dr Goh Keng Swee` | `Dr Goh Keng Swee` | `` | `(Dr Goh Keng Swee)` |

An empty label never reaches `buildSpeechCitation`; the caller uses `buildReportCitation`.

```ts
// lib/transcript.ts
export enum TranscriptSegmentKind { TEXT = 'text', BOLD = 'bold', ITALIC = 'italic' }
export interface TranscriptSegment { kind: TranscriptSegmentKind; text: string }
const INLINE_MARKUP = /(\*\*[^*]+\*\*|_[^_]+_)/g
export function parseTranscriptInline(transcript: string): TranscriptSegment[]
// split on INLINE_MARKUP; `**x**` → BOLD with markers stripped; `_x_` → ITALIC; else TEXT; drop empty strings
```

```ts
// lib/utils.ts additions
export function buildQueryString(params: Record<string, string | number | undefined>): string
// URLSearchParams of the defined entries; returns '' or `?${...}`

export function parsePersonSlug(personSlug: string): { personId: number; slug: string }
// const PERSON_SLUG = /^(\d+)(?:-(.*))?$/ at module scope; a match gives personId = Number(group 1) and slug = group 2 ?? ''; no match gives { personId: NaN, slug: '' }, so '-foo', 'foo' and '' are all not found
```

`main.tsx`: replace `new QueryClient()` with one whose `defaultOptions.queries.retry` is a named function `shouldRetryQuery(failureCount, error)` returning `false` when `error instanceof ApiError && error.status === HTTP_NOT_FOUND` and `failureCount < DEFAULT_QUERY_RETRY_COUNT` otherwise, with `HTTP_NOT_FOUND = 404` and `DEFAULT_QUERY_RETRY_COUNT = 3` exported from `app/src/constants/constants.ts` (added in this step beside `OFFICIAL_RECORD_SEARCH_URL`) and imported into `main.tsx`. The orchestrator owns `main.tsx`.

**Expected state after this commit:**
- [ ] The exported functions above exist; `shouldRetryQuery` exists in `main.tsx`
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 20. `feat: add query hooks for every endpoint`

**Files:** `app/src/api/reports/getReport.ts`, `app/src/api/sittings/getSitting.ts`, `app/src/api/sittings/getAllSittings.ts`, `app/src/api/parliaments/getAllParliaments.ts`, `app/src/api/people/getAllPersons.ts`, `app/src/api/people/getPerson.ts`, `app/src/api/people/getPersonReports.ts`, `app/src/api/people/getAllParties.ts`, `app/src/api/search/getSearchSpeeches.ts`, `app/src/api/search/getSearchReports.ts`, `app/src/api/coverage/getCoverage.ts`

**Pattern reference:** `app/STYLE.md` "API Hooks" (L39-L57); `app/src/api/client.ts:L48`

Each file: exported `Request` and `Response` interfaces mirroring step 9's schemas field for field (snake_case keys, `string` for dates, `ReportType`/`SearchSort` enums where the API uses them), a private `async function get...Response(request)` returning `apiGet<Response>(path)`, and one exported hook.

| File | Hook | Path | Key and options |
|---|---|---|---|
| `reports/getReport.ts` | `useGetReport({ report_slug })` | `/reports/${encodeURIComponent(report_slug)}` | `['reports', report_slug]` |
| `sittings/getSitting.ts` | `useGetSitting({ sitting_date })` | `/sittings/${sitting_date}` | `['sittings', sitting_date]` |
| `sittings/getAllSittings.ts` | `useGetAllSittings({ parliament_number })` | `/sittings` + query string | `['sittings', 'list', parliament_number]`, `enabled: request.parliament_number !== undefined` (0 is a valid value, so not `!!`; recorded here as the one exception to the `!!` rule) |
| `parliaments/getAllParliaments.ts` | `useGetAllParliaments()` | `/parliaments` | `['parliaments']` |
| `people/getAllPersons.ts` | `useGetAllPersons({ parliament_number?, party?, name? })` | `/people` + query string | `['people', 'list', parliament_number, party, name]` |
| `people/getPerson.ts` | `useGetPerson({ person_id })` | `/people/${person_id}` | `['people', person_id]`, `enabled: !!request.person_id` |
| `people/getPersonReports.ts` | `useGetPersonReports({ person_id, page })` | `/people/${person_id}/reports` + query string | `['people', person_id, 'reports', page]`, `enabled: !!request.person_id` |
| `people/getAllParties.ts` | `useGetAllParties()` | `/parties` | `['parties']` |
| `search/getSearchSpeeches.ts` | `useGetSearchSpeeches(request)` | `/search/speeches` + query string (`q`, `parliament_number`, `date_from`, `date_to`, `report_type`, `person_id`, `sort`, `page`) | `['search', 'speeches', ...each request field in that order]`, `enabled: !!request.q` |
| `search/getSearchReports.ts` | `useGetSearchReports(request)` | `/search/reports` + query string | `['search', 'reports', ...]`, `enabled: !!request.q` |
| `coverage/getCoverage.ts` | `useGetCoverage()` | `/coverage` | `['coverage']`, `staleTime: COVERAGE_STALE_TIME_MILLISECONDS` |

**Expected state after this commit:**
- [ ] Eleven hook files exist, each exporting one hook and its `Request`/`Response` interfaces; `getReport.ts` contains `encodeURIComponent`
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 21. `feat: add the report page`

**Files:** `app/src/routes/reports.$reportSlug.tsx`, `app/src/components/reports/BadgeReportType.tsx`, `app/src/components/reports/TextTranscript.tsx`, `app/src/components/reports/NoticeDerivedText.tsx`, `app/src/components/reports/NoticeTextUnavailable.tsx`, `app/src/components/reports/NoticeNoSpeeches.tsx`, `app/src/components/reports/NoticeErrorReport.tsx`, `app/src/components/reports/NoticeNotFoundReport.tsx`, `app/src/components/reports/ButtonCopyCitation.tsx`, `app/src/components/reports/ButtonCopySpeechLink.tsx`, `app/src/components/reports/CardSpeech.tsx`, `app/src/components/reports/ListSpeeches.tsx`, `app/src/components/reports/ListReportMetadata.tsx`

**Pattern reference:**
- route → `app/src/routes/design.tsx:L17-L20`; `app/STYLE.md` "Page Loading States" and "Error Notices"
- `NoticeErrorReport` → `app/src/components/layout/NoticeError.tsx:L13` (wrapped with fixed copy)
- `NoticeNotFoundReport`, `NoticeTextUnavailable`, `NoticeNoSpeeches` → `app/src/components/layout/NoticeEmpty.tsx:L11`
- `NoticeDerivedText` → `app/src/components/ui/alert.tsx` (`info` variant)
- copy buttons → `app/src/components/palette/ButtonCopyColourValue.tsx` (clipboard write and a sonner toast)

Route file `routes/reports.$reportSlug.tsx` serves `/reports/$reportSlug`; read the param with `Route.useParams()`.

Component contracts:

- `BadgeReportType({ reportType: string })`: `<Badge variant="tag">{REPORT_TYPE_LABELS[reportType as ReportType] ?? reportType}</Badge>`.
- `ListReportMetadata({ report: GetReportResponse })`: a `<dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">` with Date (`formatSittingDate`), Parliament (`formatParliament`), Volume, Sitting number (row omitted when `null`), Type (`BadgeReportType`), Official record: `<a href={official_record_url} target="_blank" rel="noreferrer">Read on the official record (opens in a new tab)</a>` with the link classes used in `SiteFooter.tsx`.
- `NoticeDerivedText({ officialRecordUrl })`: `Alert variant="info"` with `Info` icon, `AlertTitle` "Derived text", body: "This text was parsed from the Official Report and may differ from it. Links to individual speeches are best-effort, because a re-parse can renumber them. The official record is the authority." plus the external link.
- `NoticeTextUnavailable({ officialRecordUrl })`: `NoticeEmpty` with icon `FileText`, title "Text not in this archive yet", description "Only the title and details of this report have been collected so far. Read it on the official record.", action `Button asChild variant="outline"` → the external link.
- `NoticeNoSpeeches({ officialRecordUrl })`: `NoticeEmpty` with icon `FileText`, title "The text couldn't be split into speeches", description "The report has text, but no speeches could be parsed from it. Read it on the official record.", same action.
- `NoticeErrorReport({ onRetry, isRetrying })`: returns `<NoticeError title="Couldn't load the report" description="The report did not load. Check your connection and try again." onRetry={onRetry} isRetrying={isRetrying} />`.
- `NoticeNotFoundReport()`: `NoticeEmpty` with `SearchX`, "Report not found", "No report has this address. It may have been renamed by the archive.", action `Button asChild variant="outline"` → `Link to="/"` "Back to Home".
- `TextTranscript({ transcript })`: maps `parseTranscriptInline` to `<strong>`, `<em>` and text nodes inside `<p className="font-serif text-base leading-7">`.
- `ButtonCopyCitation({ citation })`: `Button variant="outline" size="sm"` with `Quote` icon and label "Copy citation"; handler `copyCitation` writes `navigator.clipboard.writeText(citation)` then `toast('Citation copied. The column number will be added once the archive has it.')`; on rejection `toast.error("Couldn't copy the citation.")`.
- `ButtonCopySpeechLink({ reportSlug, ordinal })`: `Button variant="ghost" size="sm"` with `Link2` icon, label "Copy link"; builds `${window.location.origin}/reports/${encodeURIComponent(reportSlug)}#s${ordinal}`; toast "Link copied. Speech links are best-effort and may move after a re-parse."
- `CardSpeech({ speech, reportSlug, sittingDate, volumeNumber, parliamentNumber })`: `<article id={`s${ordinal}`} tabIndex={-1} className="border-separator scroll-mt-24 space-y-2 border-b py-4 last:border-b-0 focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2">`. Header: `person_id !== null` → `<Link to="/people/$personSlug" params={{ personSlug: `${person_id}-${person_slug}` }}>` with the label (this `Link` is added in step 24 when the route exists; until then the label is a `<span>`); non-empty label without a person → `<span className="font-semibold">`; empty label → no header and the body in `italic text-muted-foreground` (A1). Body `TextTranscript`. Footer: `ButtonCopySpeechLink` and `ButtonCopyCitation` with `buildSpeechCitation(...)` or `buildReportCitation(...)` when the label is empty.
- `ListSpeeches({ report })`: `<section aria-labelledby="speeches-heading">` with `<h2 id="speeches-heading" className="sr-only">Speeches</h2>` and the `CardSpeech` list; an effect `scrollToSpeechAnchor` runs once after mount: reads `window.location.hash`, finds the element by id, calls `scrollIntoView()` and `focus()`.

Route component `PageReport`:

```tsx
const { reportSlug } = Route.useParams()
const { data, isLoading, isError, error, refetch, isRefetching } = useGetReport({ report_slug: reportSlug })
function retryReport() { void refetch() }
if (isLoading) return <Skeleton className="h-96 w-full" />
if (isError && error instanceof ApiError && error.status === HTTP_NOT_FOUND) return <NoticeNotFoundReport />
if (isError || !data) return <NoticeErrorReport onRetry={retryReport} isRetrying={isRefetching} />
return (
  <div className="space-y-8">
    <PageHeader title={data.title} description={data.subtitle || undefined} breadcrumb={/* Home / Report; the sitting crumb is added in step 22 */} actions={<ButtonCopyCitation citation={buildReportCitation(data.sitting_date, data.volume_number, data.parliament_number)} />} />
    <ListReportMetadata report={data} />
    <NoticeDerivedText officialRecordUrl={data.official_record_url} />
    {renderBody(data)}
  </div>
)
```

`renderBody` is a module function with the three guard returns: `!is_text_available` → `NoticeTextUnavailable`; `speeches.length === 0` → `NoticeNoSpeeches`; otherwise `ListSpeeches`. `HTTP_NOT_FOUND` is imported from `@/constants/constants` (step 19).

Two deferrals recorded for the audit: the breadcrumb's sitting crumb lands in step 22, and the person `Link` in `CardSpeech` lands in step 24, because those routes do not exist yet and `Link` is type-checked against the route tree.

**Expected state after this commit:**
- [ ] `app/src/routes/reports.$reportSlug.tsx` exports `Route`; the twelve components exist
- [ ] `grep -n "dangerouslySetInnerHTML" app/src` finds nothing
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 22. `feat: add the sitting page and the sittings browse page`

**Files:** `app/src/routes/sittings.index.tsx`, `app/src/routes/sittings.$sittingDate.tsx`, `app/src/components/sittings/ListParliaments.tsx`, `app/src/components/sittings/ListSittingsGrouped.tsx`, `app/src/components/sittings/ListSittingReports.tsx`, `app/src/components/sittings/ListAttendance.tsx`, `app/src/components/sittings/NoticeAttendanceUnavailable.tsx`, `app/src/components/sittings/NoticeErrorSittings.tsx`, `app/src/components/sittings/NoticeErrorSitting.tsx`, `app/src/components/sittings/NoticeNotFoundSitting.tsx`, `app/src/routes/reports.$reportSlug.tsx`

**Pattern reference:** step 21 route shape; `app/src/components/layout/SiteHeader.tsx:L28-L43` for a mapped list of `Link`s

`routes/sittings.index.tsx` serves `/sittings`. `validateSearch: z.object({ parliament: z.coerce.number().int().min(0).optional() })` (schema at module scope). Component `PageSittings`: without `parliament`, `useGetAllParliaments()` and `ListParliaments`; with it, `useGetAllSittings({ parliament_number: parliament })` and `ListSittingsGrouped`. `PageHeader` title "Sittings", description "Browse by Parliament, then by session or volume, then by sitting date." Breadcrumb Home / Sittings / `formatParliament` when chosen.

- `ListParliaments({ parliaments })`: `<ul>` of `Link to="/sittings" search={{ parliament: parliament_number }}` rows showing `formatParliament`, "N sittings", "N reports (M with text)", `formatSittingDate(first)` to `formatSittingDate(last)`. Rows `border-separator border-b py-3 last:border-b-0`.
- `ListSittingsGrouped({ sittings })`: `const isGroupedBySession = sittings.every((sitting) => sitting.session_number !== null)`; group in a `useMemo` into a `Map<number, SittingData[]>` keyed by `session_number` or `volume_number`; for each group a `<section>` with `<h2 className="font-serif text-xl lg:text-2xl">{isGroupedBySession ? `Session ${key}` : `Volume ${key}`}</h2>` and an `<ol>` of `Link to="/sittings/$sittingDate" params={{ sittingDate }}` rows: `formatSittingDate`, "Sitting N" when present, "Volume N" when grouped by session, "N reports". A `<p className="text-muted-foreground text-sm">` above the groups says "Grouped by volume because session numbers aren't in the archive for this Parliament." when not grouped by session.
- `NoticeErrorSittings({ onRetry, isRetrying })` wraps `NoticeError` with "Couldn't load the sittings".

`routes/sittings.$sittingDate.tsx` serves `/sittings/$sittingDate`. Component `PageSitting`: `useGetSitting`; loading, 404 (`NoticeNotFoundSitting`: "Sitting not found", "No sitting on this date is in the archive.") and error (`NoticeErrorSitting`) as step 21. `PageHeader` title `Sitting of {formatSittingDate}`, description `${formatParliament}, volume N, sitting N` (append `, session N` when present), breadcrumb Home / Sittings (`search={{ parliament: data.parliament_number }}`) / date.

- `ListSittingReports({ reports })`: `<ol>` with each `<li>` holding `Link to="/reports/$reportSlug" params={{ reportSlug: report_slug }}` with the title, the subtitle in `text-muted-foreground`, `BadgeReportType`, and when `!is_text_available` a `Badge variant="outline"` reading `TEXT_NOT_IN_ARCHIVE_LABEL`.
- `ListAttendance({ attendance })`: two `<section>`s, "Present (N)" and "Absent (N)", each a `<ul>` with the name as a `Link` to the person when `person_id !== null` else plain text, and the constituency in `text-muted-foreground` when non-empty; under the Absent heading: "An absence can have many causes, including leave and official duties."
- `NoticeAttendanceUnavailable()`: `NoticeEmpty` with `Users`, "Attendance for this sitting isn't in this archive yet", "Attendance lists have been collected up to 13 August 2012." (the date comes from `useGetCoverage` `attendance_last_sitting_date` through `formatSittingDate`; render the sentence without the date while loading).

Page renders `ListAttendance` when `is_attendance_available`, else `NoticeAttendanceUnavailable`. Also in this step: add the sitting crumb to `routes/reports.$reportSlug.tsx` (deferred from step 21).

**Expected state after this commit:**
- [ ] Both route files export `Route`; the eight components exist
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 23. `feat: add the people browse page`

**Files:** `app/src/routes/people.index.tsx`, `app/src/constants/people/constants.ts`, `app/src/components/people/FormFilterPersons.tsx`, `app/src/components/people/ListPersons.tsx`, `app/src/components/people/NoticeErrorPersons.tsx`

**Pattern reference:** `app/src/components/design/SectionForms.tsx` for `Form*` fields and `Select`; `app/STYLE.md` "Forms"

`constants/people/constants.ts`: `export const PARLIAMENT_DROPDOWN_OPTIONS = Array.from({ length: LATEST_MEMBERSHIP_PARLIAMENT_NUMBER + 1 }, (_, parliamentNumber) => ({ value: String(parliamentNumber), label: formatParliament(parliamentNumber) }))` and `export const FILTER_ALL = 'all'`.

`validateSearch: z.object({ parliament: z.coerce.number().int().min(0).optional(), party: z.string().optional(), name: z.string().optional() })`.

`FormFilterPersons({ defaultValues, parties, onSubmit })`: `formSchema = z.object({ parliament: z.string(), party: z.string(), name: z.string() })` at module scope; fields: Parliament `Select` (`FILTER_ALL` "All Parliaments" plus `PARLIAMENT_DROPDOWN_OPTIONS`), Party `Select` (`FILTER_ALL` "All parties" plus `parties`), Name `Input` with a visible `Label`. Submit "Filter" and a "Clear" `Button variant="outline" asChild` → `Link to="/people"`. The page's `applyFilters` handler maps form values to search params (dropping `FILTER_ALL` and empty strings) and navigates.

`ListPersons({ persons })`: `<ul>` rows with the person's name (a `<span className="font-semibold">` in this step; step 24 turns it into `Link to="/people/$personSlug" params={{ personSlug: `${person_id}-${person_slug}` }}` once that route exists, the third recorded deferral) and a `text-muted-foreground text-sm` line of memberships as `formatParliament(n), party` joined with `; `. Empty: `NoticeEmpty` with `Users`, "No people match these filters", "Try a wider filter or a different spelling."

`NoticeErrorPersons` wraps `NoticeError` with "Couldn't load the people". Page: `useGetAllParties()` and `useGetAllPersons(search)`; combined `isLoading`.

**Expected state after this commit:**
- [ ] Route, constants and three components exist; `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 24. `feat: add the person page`

**Files:** `app/src/routes/people.$personSlug.tsx`, `app/src/components/people/TableMemberships.tsx`, `app/src/components/people/TableParliamentCounts.tsx`, `app/src/components/people/ListPersonReports.tsx`, `app/src/components/people/PaginationPrevNext.tsx`, `app/src/components/people/NoticeErrorPerson.tsx`, `app/src/components/people/NoticeNotFoundPerson.tsx`, `app/src/components/people/ListPersons.tsx`, `app/src/components/reports/CardSpeech.tsx`, `app/src/components/sittings/ListAttendance.tsx`

**Pattern reference:** step 21; `app/src/components/ui/table.tsx`; `app/src/components/ui/pagination.tsx`

`validateSearch: z.object({ page: z.coerce.number().int().min(1).optional() })`. Page `PagePerson`: `const { personId, slug } = parsePersonSlug(personSlug)`; `!(personId >= 1)` (covers `NaN` and `0`) → `NoticeNotFoundPerson` without calling the hook's query (`enabled: !!request.person_id` is false for `NaN`); `useGetPerson({ person_id: personId })`; after load, `redirectToCanonicalSlug` effect navigates with `replace: true` when `data.person_slug !== slug`. 404 → `NoticeNotFoundPerson` ("Person not found", "No person has this address. The archive may have renumbered it."). `PageHeader` title `canonical_name`, description "Also recorded as: A; B" when variants exist, breadcrumb Home / People / name. The header action "Search this person's speeches" (`Button asChild variant="outline"` → `Link to="/search" search={{ person: data.person_id }}`) lands in step 26 once the search route exists, the fourth recorded deferral.

- `TableMemberships({ memberships })`: static `Table`, caption "Memberships", columns Parliament (`formatParliament`, plus " (not a member)" when `is_member === false`), Party (as stored), Constituencies (joined by `, `).
- `TableParliamentCounts({ parliamentCounts })`: static `Table`, caption "Speeches and attendance by Parliament", columns Parliament, Speeches, Present, Absent; below it two sentences in `text-muted-foreground text-sm`: "Attendance is counted from the sitting lists as stored. An absence can have many causes, including leave and official duties, so these are counts, not a score." and "Speech text and attendance lists end on 13 August 2012, so later Parliaments show no counts." (dates from `useGetCoverage` through `formatSittingDate`). When `parliamentCounts` is empty, render only the second sentence.
- `ListPersonReports({ reports })`: `<ol>` rows: `Link` to the report, `formatSittingDate`, `formatParliament`, `BadgeReportType`, "N speeches".
- `PaginationPrevNext({ page, hasNextPage, onPageChange })`: `Pagination` with `PaginationPrevious disabled={page === 1}` and `PaginationNext disabled={!hasNextPage}`; handlers `goToPreviousPage`, `goToNextPage`.
- `NoticeErrorPerson` wraps `NoticeError` with "Couldn't load this person".

Also in this step: `CardSpeech`, `ListAttendance` and `ListPersons` gain the `Link` to `/people/$personSlug` (deferred from steps 21, 22 and 23).

**Expected state after this commit:**
- [ ] Route and six components exist; `CardSpeech.tsx`, `ListAttendance.tsx` and `ListPersons.tsx` contain `to="/people/$personSlug"`
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 25. `feat: add the coverage page`

**Files:** `app/src/routes/coverage.tsx`, `app/src/components/coverage/ListCoverageCounts.tsx`, `app/src/components/coverage/TableCoverageYears.tsx`, `app/src/components/coverage/ListAttributionFigures.tsx`, `app/src/components/coverage/ListKnownGaps.tsx`, `app/src/components/coverage/NoticeErrorCoverage.tsx`

**Pattern reference:** step 24 static table

- `ListCoverageCounts({ coverage })`: `<dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">` of Reports, Reports with text, Speeches, Speeches linked to a person, People, Memberships, Sittings, Attendance rows, Attendance rows linked to a person; numbers via `toLocaleString('en-SG')`; two lines: "Speech text covers {first} to {last}." and "Attendance lists run to {attendance_last}."
- `TableCoverageYears({ years })`: `Table` with caption "Reports with text by year", columns Year, Reports, With text, Share (`Math.round(100 * text / reports)` with `%`, "0%" when no reports).
- `ListAttributionFigures()`: heading "How well speeches are linked to people", a sentence "Measured by the scraper on {date} for {ATTRIBUTION_SCOPE}. The three figures are quoted together because each denominator hides something the others show.", then a `<dl>` of `ATTRIBUTION_FIGURES`.
- `ListKnownGaps()`: `<ul>` of `KNOWN_GAPS`.
- `NoticeErrorCoverage` wraps `NoticeError` with "Couldn't load the coverage figures".

Page `PageCoverage`: `PageHeader` "What the archive covers", description "Which years have text, how well speeches are linked to people, and the known gaps."; `useGetCoverage()`; sections with `<h2 className="font-serif text-xl lg:text-2xl">`.

**Expected state after this commit:**
- [ ] Route and five components exist; `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 26. `feat: add the search page`

**Files:** `app/src/routes/search.tsx`, `app/src/components/search/FormSearch.tsx`, `app/src/components/search/ListSpeechMatches.tsx`, `app/src/components/search/ListReportMatches.tsx`, `app/src/components/search/CardSpeechMatch.tsx`, `app/src/components/search/CardReportMatch.tsx`, `app/src/components/search/SnippetHighlighted.tsx`, `app/src/components/search/NoticeTextCoverage.tsx`, `app/src/components/search/BadgePersonFilter.tsx`, `app/src/components/search/NoticeErrorSearch.tsx`, `app/src/routes/people.$personSlug.tsx`

**Pattern reference:** step 23 form; step 24 pagination

`validateSearch: z.object({ q: z.string().optional(), parliament: z.coerce.number().int().min(0).optional(), from: z.string().optional(), to: z.string().optional(), type: z.enum(ReportType).optional(), person: z.coerce.number().int().min(1).optional(), sort: z.enum(SearchSort).optional(), page: z.coerce.number().int().min(1).optional(), title_page: z.coerce.number().int().min(1).optional() })`.

- `FormSearch({ defaultValues, parliaments, onSubmit })`: fields `q` (`Input type="search"`, label "Search words", `z.string().min(1, { error: 'Enter at least one word.' })`), Parliament `Select` (`FILTER_ALL` plus one option per `parliaments` entry labelled with `formatParliament`), Type `Select` (`FILTER_ALL` plus `REPORT_TYPE_DROPDOWN_OPTIONS`), From and To (`Input type="date"` with visible `Label`s), Sort `Select` (`SEARCH_SORT_DROPDOWN_OPTIONS`). Submit `Button` "Search". Schema and constants at module scope.
- `BadgePersonFilter({ personId })`: `useGetPerson` for the name; `Badge variant="secondary"` "Within speeches by {name}" and a `Button variant="ghost" size="icon-sm"` with `X` icon, `aria-label="Remove the person filter"`, handler `removePersonFilter` navigating with `person` removed.
- `NoticeTextCoverage()`: `useGetCoverage()`; `Alert variant="info"`: "Speech text covers {first} to {last}. Later reports can be found by title only." with `Link to="/coverage"` "See what the archive covers." Renders nothing while loading or without data.
- `SnippetHighlighted({ snippet })`: module function `parseSnippetSegments(snippet)` splits on `SNIPPET_MARK_START`/`SNIPPET_MARK_END`; marked segments render `<mark className="bg-highlight text-highlight-foreground rounded-xs px-0.5">`; everything else is text.
- `CardSpeechMatch({ result })`: title `Link to="/reports/$reportSlug" params hash={`s${ordinal}`}`; meta line: `formatSittingDate`, `formatParliament`, `BadgeReportType`; Speaker label (`Link` to the person when linked, else text); `SnippetHighlighted`.
- `CardReportMatch({ result })`: title `Link`; meta line plus `Badge variant="outline"` "Title match" and, when `!is_text_available`, `TEXT_NOT_IN_ARCHIVE_LABEL`; `SnippetHighlighted` of the title snippet.
- `ListSpeechMatches({ results })` and `ListReportMatches({ results })`: `<section>` with `<h2 className="font-serif text-xl lg:text-2xl">` "Speech matches" / "Title matches", an `<ol>`, and the empty state `NoticeEmpty` with `SearchX`, "No speech matches" / "No title matches", "Nothing matches these words. Common words such as "the" are ignored. Try different words or a wider date range."
- `NoticeErrorSearch` wraps `NoticeError` with "Couldn't run the search".

Page `PageSearch`: `PageHeader` "Search"; `useGetAllParliaments()` for the form; `FormSearch`; `BadgePersonFilter` when `person`; `NoticeTextCoverage`; when `q` is present, `useGetSearchSpeeches({...page})` and `useGetSearchReports({...title_page})`, each with its own `Skeleton`, `NoticeErrorSearch`, list and `PaginationPrevNext` (the two paginations navigate with `page` and `title_page` respectively). `applySearch` maps form values to search params (dropping `FILTER_ALL` and empty strings) and resets both page params.

Also in this step: `routes/people.$personSlug.tsx` gains the "Search this person's speeches" header action (deferred from step 24).

**Expected state after this commit:**
- [ ] Route and the nine components exist; `grep -n "dangerouslySetInnerHTML" app/src` finds nothing; `people.$personSlug.tsx` contains `to="/search"`
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .` pass

---

## 27. `feat: wire the home page, nav, header search and footer`

**Files:** `app/src/routes/index.tsx`, `app/src/components/layout/SiteHeader.tsx`, `app/src/components/layout/SiteFooter.tsx`, `app/src/vite-env.d.ts`, `app/.env.example`, `app/CLAUDE.md`

**Pattern reference:** `app/src/components/layout/SiteHeader.tsx:L9-L17`, `SiteFooter.tsx:L1-L29`

- `NAV_ITEMS`: Home `/`, Search `/search`, Sittings `/sittings`, People `/people`, Coverage `/coverage`, Design `/design`, Palette `/palette`. `activeOptions={{ exact: item.to === '/' }}` so Sittings and People stay active on child pages.
- Header search: `submitSearch` moves inside `SiteHeader` (it needs `useNavigate`): reads `new FormData(event.currentTarget).get('q')`, trims, navigates to `/search` with `search: { q }` when non-empty.
- Footer: Browse links become `{ label: 'By sitting date', to: '/sittings' }`, `{ label: 'By person', to: '/people' }`, `{ label: 'By Parliament', to: '/sittings' }`; About "How the record is parsed" → `{ to: '/coverage' }`; Source "Official Report" → `{ href: OFFICIAL_RECORD_SEARCH_URL }` external. Keep `FOOTER_COLUMNS` declared `as const` so each `to` stays a literal route type that `Link` accepts, and branch with `'to' in link` in the map; do not widen `to` to `string`. Entries with no page keep `href: '#'`.
- Contact line: `const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? ''` at module scope in `SiteFooter.tsx`; render `{CONTACT_EMAIL && (<p>Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>)}` under the "Unofficial" line. `app/CLAUDE.md` says `client.ts` is the only reader of `VITE_API_URL`; `VITE_CONTACT_EMAIL` is read only in `SiteFooter.tsx`, and the environment table says so.
- `vite-env.d.ts`: `readonly VITE_CONTACT_EMAIL?: string`. `.env.example`: `VITE_CONTACT_EMAIL=` (empty). `app/CLAUDE.md` environment table: `VITE_CONTACT_EMAIL`, default empty, "Footer contact address; the line is hidden while empty. Read only in `SiteFooter.tsx`."
- Home: `PageHeader` title "Hansard", description "The Singapore parliamentary record from 1955, organised by person and by sitting, with citation-ready links."; a `role="search"` form navigating to `/search`; three `Card`s linking to Sittings ("Browse by Parliament, session or volume, and date."), People ("Every person who spoke, with their memberships and speeches.") and Coverage ("What the archive holds and where the gaps are.").

**Expected state after this commit:**
- [ ] `NAV_ITEMS` has seven entries; `grep -n "VITE_CONTACT_EMAIL" app/src/components/layout/SiteFooter.tsx app/src/vite-env.d.ts app/.env.example app/CLAUDE.md` finds all four; `grep -rn "@" app/src/components/layout/SiteFooter.tsx` finds no literal email address
- [ ] `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .`, `pnpm contrast` pass

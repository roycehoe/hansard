# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `../CLAUDE.md` for the full project setup, architecture, and conventions, and `../STYLE.md` for the coding rules. This file documents patterns specific to the `crud/` layer.

**This file does not override `../STYLE.md`.** Because the most specific `CLAUDE.md` wins, anything stated here would outrank the style guide inside `crud/`, so this file must not restate or reinterpret a style rule. It covers only what is genuinely local to this layer: the constructor and mutation shapes, method naming, eager loading, and the shared full-text constants. Where a rule is in question, `../STYLE.md` governs and `../STYLE-RULINGS.md` is the authority behind it.

**This API is read-only** (`docs/adr/0001-read-only-api.md`). The mutation shapes below are kept so the guide stays whole and so a write path, if one ever arrives under a new ADR, copies the right shape. No class in this directory writes today.

**Terminology.** The brief for this app calls a `speaker` row a Membership. The SQLModel class keeps the table's name (`Speaker`), and the SQL expressions reference the columns as they are (`Speech.speaker_id`, `Attendance.speaker_id`). Everything else in this layer says Membership: the class is `CRUDMembership`, a parameter holding those ids is `membership_ids`, and a mapping keyed by them is `membership_id_to_*`.

## CRUD Class Structure

Every CRUD class follows the same constructor pattern:

```python
class CRUDSpeech:
    def __init__(self, session: Session):
        self.session = session
```

Session lifetime is managed by the FastAPI dependency (`get_session()` in `database/engine.py`). CRUD classes never open, commit on failure, or close sessions, they only use the session they receive.

## Standard Mutation Pattern

All writes follow the same three-step sequence:

```python
def create(self, model: Model) -> Model:
    self.session.add(model)
    self.session.commit()
    self.session.refresh(model)
    return model
```

Batch mutations add all objects first, issue one `commit()`, then refresh all:

```python
for item in items:
    self.session.add(item)
self.session.commit()
for item in items:
    self.session.refresh(item)
```

`../STYLE.md` puts the `updated_at` write in the prepare phase, so it lands before the fields the method was asked to write. What is local to this layer is how a batch does it. Compute the timestamp before the loop and write that same value to every row, so the batch stays internally consistent.

```python
def update_all_party(self, memberships: list[Speaker], party: str) -> list[Speaker]:
    updated_at = datetime.now(timezone.utc)

    for membership in memberships:
        membership.updated_at = updated_at
        membership.party = party
        self.session.add(membership)
```

`create` is exempt: the model's `default_factory` already sets both timestamps.

## Dynamic Where Clauses

When a method accepts multiple optional filters, accumulate conditions in a list and unpack:

```python
filters = []
if parliament_number is not None:
    filters.append(Speaker.parliament_number == parliament_number)
if party is not None:
    filters.append(Speaker.party == party)
statement = select(Speaker).where(*filters)
```

Do not build nested `and_()` chains.

## Method Naming Conventions

Read-method names are built from the columns they filter on, never from the concept the caller has in mind, `get_count_by_report_id_and_membership_id`, not `get_opening_speech_count_by_report_id`. The tables below are the shapes that vocabulary comes in.

### Read methods

| Pattern | Returns | Example |
|---|---|---|
| `get(id)` | `Optional[Model]` | `get(person_id)`: single by PK |
| `get_by_<field>(value)` | `Optional[Model]` | `get_by_report_id(report_id)`: single by non-PK field |
| `get_by_ids(ids)` | `list[Model]` | `get_by_ids([1, 2, 3])`: multiple by PK list |
| `get_all()` | `list[Model]` | `get_all()`: unfiltered full table |
| `get_all_by_<field>(value)` | `list[Model]` | `get_all_by_report_id(report_id)`: list filtered by one field |
| `get_all_excluding_ids(ids)` | `list[Model]` | records not in the given ID list |
| `get_all_filtered(*, ...)` | `list[Model]` | each filter is `Optional`; see the `*` note below |
| `get_with_<relations>(id)` | `Optional[Model]` | single record with named relationships pre-loaded |
| `get_all_with_<relations>(...)` | `list[Model]` | list with named relationships pre-loaded |
| `get_all_by_<field>_with_<relations>(...)` | `list[Model]` | filtered list with named relationships pre-loaded |
| `get_<key>_to_<value>[_by_<field>](...)` | `dict[K, V]` | `get_membership_id_to_speech_count_by_membership_ids(ids)`: one primitive mapping, one value per method |
| `get_<value>()` | primitive | `get_count()`, `get_max_sitting_date_with_text()`: a single scalar |

**Rules:**
- `get` prefix → single result, returns `Optional`.
- `get_all` prefix → list result, never `Optional`.
- The `with_<relations>` suffix is mandatory when a method eager-loads relationships. It tells callers exactly which attributes are safe to access without triggering lazy loading. If the suffix is absent, no relationships are loaded.
- `filtered_by_<criteria>` suffix is used when a dynamic multi-value filter is applied on top of a base query.
- Filters are `Optional`, defaulting to "no filter". A `*` separator is warranted where accidentally overriding a filter's default would silently narrow the result set, which is the danger test in `../STYLE.md`, not a blanket "multi-filter methods are always keyword-only" convention. Do not add `*` to a signature that does not meet that test.
- An aggregate comes back as a `dict` of primitives, one value per method. A method never returns a tuple, a `Row`, or a dataclass it built (`../STYLE-RULINGS.md` R30, R35). Where a service needs three figures per key, that is three methods.
- A list method over `report` defers `markdown_content` with `.options(defer(Report.markdown_content))` unless the caller reads it. A deferred column loads lazily on access, so a service never reads it off a list row; it asks `get_all_ids_with_text_by_ids` instead.
- A join inside a statement is fine when it filters or orders the one table the method returns (`CRUDSpeech.get_all_by_query_filtered` joins `Report` for the Parliament filter and still returns `list[Speech]`). A method never returns rows of a second table.

### Mutation methods

| Pattern | Returns | Notes |
|---|---|---|
| `create(model)` | `Model` | Insert new record |
| `update_<field>(model, new_value)` | `Model` | Update one field or one logical group of fields |
| `update_all_<field>(models, new_value)` | `list[Model]` | Batch update: one commit for the whole list |
| `delete(model)` | `Model` | Hard delete |

When an update logically groups multiple fields under one concept, name the method after the concept, not the individual fields. A concept name is legitimate only while the method can keep the promise it makes: **R47** reads the name as a claim about the row after the call, and it fails if an argument can falsify the claim or if the method writes something the name does not state and no parameter supplies.

Where the same field group already appears in two or more independent signatures on the same model, the method takes one typed record instead of loose parameters, and that record is declared beside the model in `database/`. A singular method and its `update_all_*` twin do not count as two.

**A domain verb is right for a single-attribute write; past that, use `update_`** (`../STYLE-RULINGS.md` R42). `favourite()` setting `is_favourite = True` is correct: the name says exactly which attribute moved.

The line is attribute count and inferability, not hard-coding. A method that writes several attributes a reader cannot guess from the name becomes a general `update_` taking them as parameters, never a domain verb quietly setting a status, an error code and two timestamps.

### Private helpers

Prefix with `_`. Use when a public method delegates to a shared base query, so the statement builder is not duplicated. A private helper is defined above the class that calls it.

---

## Eager Loading Strategy

Use `selectinload` for **one-to-many** relationships (collections) and `joinedload` for **many-to-one** relationships (single objects):

```python
# Collection → selectinload
.options(selectinload(Report.speeches))

# Single FK reference → joinedload
.options(joinedload(Speech.report))
```

**Filtered eager load**: apply additional `WHERE` conditions on the relationship using `.and_()` on the attribute inside `selectinload`:

```python
.options(selectinload(Report.speeches.and_(*speech_where_clauses)))
```

**What not to do:**
- Do not access a relationship attribute on an object returned by a method without `with_<relations>` in its name, the session may be closed by that point, and lazy loading will either fail or issue N+1 queries.
- Do not add `.options()` to a method that doesn't advertise the relationships in its name. If the service needs a relation, add a new method (or a new variant) and name it accordingly.

The models in `database/` declare no relationships today. Services join by ids with `get_by_ids` on the related table, or ask `middleware/membership.py` to resolve Memberships to Persons.

---

## Full-text search constants

`crud/text_search.py` holds `TEXT_SEARCH_CONFIGURATION` (`literal_column("'english'")`), `EXACT_TEXT_SEARCH_CONFIGURATION` (`literal_column("'simple'")`), `HEADLINE_OPTIONS` and `HIGHLIGHT_ALL_OPTIONS`, plus three expression builders both `CRUDSpeech` and `CRUDReport` use: `get_match_tsquery` (the tsquery for the index match and for ranking), `get_match_filter` (the index match, plus an exact-form regex check on the text column when the query has quotes) and `get_headline`. Report title search reads the stored `title_tsv` column and speech search the stored `transcript_tsv` column, so both build only the query side. The configuration is a SQL literal, never a bound parameter. The rule dates from when title search filtered through an expression index, which the planner matches only when the expression is identical. The module holds constants and expression builders only; it is not a CRUD class and must not grow a session or a statement.

`crud/location_name.py` holds `get_folded_location_name`, the SQL expression that folds a seat name (runs of spaces and hyphens to one space, trimmed, a trailing GRC or SMC dropped, lower-cased). `CRUDMembership.get_all_by_location_name` and the seat filter in `CRUDSpeech` both compare through it, so they always agree on what a seat is called. Like `text_search.py`, it holds an expression builder only, never a session or a statement.

## A missing record is the caller's decision, not CRUD's

A `get` returns `Optional[Model]`. CRUD reports what the database holds; whether absence is an error depends on the caller's context, and CRUD does not know it. The caller, a validator, or the service, checks and raises.

```python
# crud/report.py: CRUD reports absence
def get_by_report_id(self, report_id: str) -> Optional[Report]:
    statement = (
        select(Report)
        .options(defer(Report.markdown_content))
        .where(Report.report_id == report_id)
    )
    return self.session.exec(statement).first()

# the caller decides absence is an error, and raises without parentheses
report = CRUDReport(session).get_by_report_id(report_id)
if report is None:
    raise ReportNotFoundException
```

Two rules from `../STYLE.md` are load-bearing here and are stated there, not restated as local convention: exception classes take no constructor arguments, so raise `ReportNotFoundException` without `()`; and checking a value you already hold for `None` and raising is not a look-before-you-leap pre-check, so it stays legal in every layer.

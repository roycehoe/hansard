# STYLE.md

Personal coding idioms for this codebase — only the things a reader would get wrong without being told. Follow them when writing or reviewing code.

**The authority behind this file is `api/STYLE-RULINGS.md`** — the append-only log of numbered rulings (R1–R47). Most were ruled directly; R20–R25 and R30–R35/R37 were ruled by delegation and are reversible as such. Where this file and a ruling disagree, the ruling governs and this file is what needs fixing. A new convention is recorded there first, then propagated here in the same commit.

**Enforcement.** `ruff` owns exactly two things here — import order and unused names (`select = ["I", "F"]`) — so everything below is enforced by review. `ruff format` is the formatter and is enforced; run it before every commit. Seven rules are queued to move to tooling once their existing violations are cleaned: annotation presence (`ANN*` minus `ANN204`, which reverses the `__init__` carve-out), `else` after an exit (`RET505`–`508`), the bare variable before a `return` (`RET504`), blind `except` (`BLE001`), magic-number comparisons (`PLR2004`), `print()` (`T201`/`T203`), naive `datetime` (`DTZ003`/`DTZ005`).

**Grades.** `blocking` — a reviewer blocks the PR on it. `expected` — the default; deviating needs a reason stated in the PR. `expected†` — `expected`, with one recorded blocking carve-out in the reference. `taste` — a suggestion; the author decides. **Preference** — team default where a technical alternative exists. A rule yields only to a demonstrated technical cost, never to a style preference, and a yield is recorded as conscious new precedent. Never flatten a `taste` into a "must".

**Where a rule already has live counter-sites, they are accepted** (R38). Consistency outranks correctness at the level of style: a defect that is uniform across the codebase stays uniform until a deliberate sweep changes it everywhere, and a review finding whose construct is codebase-wide is an observation about that pending sweep rather than a finding. This governs existing sites only. New code never joins a divergence.

---

## Naming

The layer decides the name's shape. `expected`

| Thing | Pattern | Example |
|---|---|---|
| CRUD class | `CRUD` + PascalCase domain | `CRUDSpeech` |
| CRUD method | verb, or verb + the filters it applies | `create_many`, `get_by_report_id_and_speaker_id` |
| Service function | snake_case verb phrase | `get_speech_transcript`, `search_speeches` |
| Request schema | `Create`/`Update` + PascalCase + `Request` | `UpdateSpeechRequest` |
| Response schema | PascalCase + `Response`, or + `Data` for a nested payload | `GetAllSpeakersResponse`, `SpeechData` |
| Exception class, one file per domain | `Domain` + `Verb`/`Noun` + `Exception` | `SpeechNotFoundException` |

The affix carries type, purity, state and intended use, so the reader never opens the body to find out. Never Hungarian notation. `expected`

| Affix | Applies to | Example |
|---|---|---|
| `is_` | every boolean variable and parameter | `is_speech_procedural` |
| `_is_` | pure boolean-returning private helper, about a state that already holds | `_is_suspected_http_method_probing` |
| `_should_` | pure boolean-returning private helper, deciding an action not yet taken | `_should_include_procedural_speeches` |
| `_get_` | value-returning private helper | `_get_fallback_sitting_title` |
| `_verb_noun` | side-effecting private helper (never `_do_`) | `_release_connection_slot` |
| `_at` | timestamps | `created_at`, `completed_at` |
| `{key}_to_{value}` | dicts and mappings | `speaker_name_to_speaker`, `speaker_id_to_speech_count` |
| `noun_to_verb` | an object held in order to act on it | `speeches_to_search`, `speaker_to_load` |
| `error` | the variable bound by `except ... as` | `error`, `error_to_record`, `unexpected_failure` |

When naming the variable that holds a call's result, strip only `get_` from the function name: `get_fetch_sitting_report_response` holds a `fetch_sitting_report_response`.

**Deprecated: the `validated_` / `unvalidated_` variable prefix.** Do not add it, in any layer. Name the variable for what it is and validate it — reassigning the same value to a second name to record that a check happened is noise the reader has to track. This does *not* affect the `get_validated_*` **function** naming convention, which stands. The same defect recurs whenever a qualifier only restates what the context already implies — a field on a search request named `requested_page_size` gains nothing over `page_size` (R24).

- `expected` — **Name the function for what it returns or mutates, and propagate a rename everywhere.** When the returned type's name changes, the rename travels through router, service, schema and every import list in the same commit. A router function's name always matches its service function's name — that is the explicit coupling between the layers. Never join branches with `or` in the name — the branching is irrelevant to the caller; name the function for the end goal, not the paths it takes (R24).
- `expected` — **`is_` is not optional on a boolean.** Every boolean variable and parameter takes `is_`; a boolean constant takes `IS_`.
- `expected` — **Spell the domain object out in full.** No abbreviations ever, and no bare `message`/`document`/`user` where the type is more specific. Loop variables too; an `enumerate` counter may be `i` only when the index has no domain meaning.
- `expected` — **A name is guessable from the import path alone.** A reader holding only the path and the name must be able to guess what the thing is and how it is grouped (R31). Spelling a word out in full does not save it: `envelope`, `resolved`, `drain`, `turn`, `owned`, `stranded`, `touch`, `pair`, `cohort` and a `data` wrapper were each rejected in review for naming a container or a metaphor rather than the domain. A vendor's product name is an implementation detail and never reaches a module or function name — the module that calls a vendor's email API is `send_…`, not named for the vendor.
- `expected` — **One word per concept, and the domain prefix on every exception class.** The same word appears in the `ErrorCode`, the message and the class name.
- `expected` — **The request-body parameter is named per layer, and never `payload`.** In routers it takes the full descriptive name of its schema; in services it is just `request`, because the function's own name already carries the request type.

  ```python
  # in a router function, beside `request: Request`
      search_speeches_request: SearchSpeechesRequest,

  # in the matching service function, same schema
      request: SearchSpeechesRequest,
  ```

- `expected` — **The caught exception is `error`** (R45). Where the handler holds it in order to hand it to something else, it takes the `noun_to_verb` affix above: `error_to_record`, `error_to_raise`. A parameter that only reads the exception it was handed is plain `error`, because the affix states why a value is held and inside the recorder the holding is over. Where a `BaseException` catch-all sits beside a typed handler in the same `try`, the catch-all is `unexpected_failure`, so the two blocks do not read alike. `e` and `exc` are already out under *Spell the domain object out in full*. FastAPI exception-handler parameters keep `exc` and are not reached by this rule.

  ```python
  # held in order to record it
      except AppHttpExceptionBase as error_to_record:
          _record_search_failure(request, error_to_record, session)
          raise

  # typed handler beside its catch-all
      except SpeechSearchError as error:
          ...
      except BaseException as unexpected_failure:  # noqa: BLE001 — the failure must be recorded
  ```

- `expected` — **No hedge words in a name** (`_if_needed`, `_maybe_`). A hedge describes optional behaviour, which belongs in the logic, not the name.
- `expected` — **Validators come in exactly two shapes.** `get_validated_*` returns the validated object or raises — use it when the caller needs the object. `validate_can_*` returns `None` and raises — use it for an authorization gate the caller only needs to know passed. Never return `True`/`False` from either: a boolean forces the caller to branch, raising makes the failure path unambiguous.

  ```python
  def get_validated_speaker(speaker: Optional[Speaker]) -> Speaker:
      if speaker is None:
          raise SpeakerNotFoundException
      return speaker

  def validate_can_search_speeches(search_term_length: int, page_size: int) -> None:
      if search_term_length < _MIN_SEARCH_TERM_LENGTH:
          raise SpeechSearchTermTooShortException
      if page_size > _MAX_PAGE_SIZE:
          raise SpeechPageSizeTooLargeException
  ```

  A third shape does not belong in `validators/`: functions that wrap an *outbound HTTP call* and map its failures to typed exceptions. They belong in `services/`, as a private `_get_validated_*` helper beside the call site (R20).

---

## Layers

- `expected†` — **CRUD does one C/R/U/D on what it is handed.** A method that queries *and* mutates is two methods, and the decision between them belongs to the service. The method takes the row it is given rather than looking it up itself.
- `blocking` — **CRUD holds no business rule, on either side** (R30, R42). **Reading:** every filter value is a parameter and the name lists the columns filtered on, never the concept the service has in mind. `get_count_by_report_id_and_speaker_id_and_ordinal(report_id, speaker_id, ordinal)`, never `get_opening_speech_count_by_report_id`. **Writing:** the test is how many attributes the method writes and whether its name identifies them. A domain verb is right for a **single** attribute the name names — `favourite()`, `mark_as_read()` — and `accept_terms()` is fine because its two are spelled out by the name. Once a method writes several attributes a reader cannot infer, it is a general `update_` taking those fields: `update_failure(message, error_category, error_message, …)`, never `mark_as_failed()` quietly setting status, an error code and timestamps. **Returning:** SQLModel objects or primitives, no composite of its own, and nothing no caller consumes.
- `expected` — **A lookup names every filter it applies**, with `_and_` between them: `get_by_report_id_and_speaker_id`.
- `expected` — **Instantiate CRUD and call it in one expression:** `speaker = CRUDSpeaker(session).get(speaker_id)`. Never bind the instance to a variable first — it holds no reusable state, so the intermediate name buys nothing and reads as though it did.
- `expected†` — **Validators and `utils/` take data and return data or raise.** No session, no I/O, no hidden mutation — that is what makes them safe to import from any layer. A function takes the values it reads, not the object holding them — pass primitives, and pass the row only once that would mean three or more arguments (R32). A pure function belongs in `utils/`, and a function is never defined inside another function.
- `blocking` — **Never share sideways between peers at the same layer.** Two peers are never collapsed into each other; where sharing genuinely is right it comes from a *lower* layer, because sideways sharing couples peers and invites circular imports. **For two `gateway/` modules, that lower layer is `utils/`** — a `gateway/` module may import a pure helper from `utils/`, and doing so is required rather than merely tolerated, because the alternatives (one gateway importing the other, or a third gateway module holding the shared helper) are both the violation. The constraint that keeps it safe is directional: `utils/` imports nothing from `gateway/` or any layer above it. Not a licence to reach into `utils/` for anything impure — if the shared thing needs a `Session` or `database/`, it is not a `utils/` candidate.
- `expected` (judgment call) — **Collapse duplication only when it is mechanically identical *and* its meaning is fixed** — the same exceptions handled the same way, one exception-to-`ErrorCode` mapping. Duplicate when the copies encode business rules that could plausibly diverge, even if they are byte-identical today.
- `taste` — **A shared base schema class is a judgement call**, in four criteria: a short file does not need one; a file becoming excessively long may use one to shorten it; a **1-1 mapping** may be considered; **non-1-1 is generally a bad idea**, because a base plus extensions forces the reader to assemble one class's definition from two places. Never route this to a linter.
- `expected` — **`crud/` is a Table Data Gateway, and a method's name is a claim about the row after the call.** If any legal combination of arguments falsifies that claim, or the method writes anything the name does not state and no parameter supplies, the name asserts a rule the method does not enforce (R47). A wide write gets a typed record only where the same field group already appears in two or more independent signatures on the same model, a singular method and its `update_all_*` twin not counting as two; the record is declared beside the model it describes. Otherwise the method takes exactly the fields it sets, with no optional parameters.
- `expected` — **A gateway is named for the concrete action and returns a parsed model — and does nothing past that.** Nothing vendor-shaped crosses into `services/`; the SDK's return value is wrapped in a Pydantic model at the boundary, with no vendor-error catch and no domain exception raised along the way — interpreting why the call failed belongs to the caller, not the gateway (R22). This governs every new gateway module.
- `expected` — **A concern consumed by more than one service is not a service — it goes in `middleware/`, which composes gateway calls.** Where code goes is `api/CLAUDE.md`'s table, not this guide's; see R23 and R29 — the deciding test is composition, not consumer count.
- `expected†` — **No helper for logic that is *both* single-use *and* uncomplicated.** The test is a conjunction — both halves must hold before the helper is questionable. A helper called from several places, or carrying real branching, earns its name however short its call list is. Duplicate until the shape is proven. One carve-out even when both halves hold: a one-liner helper is legitimate when its name carries meaning the code cannot express — the name stands in for the comment the no-comments rule forbids (R24).
- `expected` — **No indirection that only re-supplies what the call site already has**, including a helper for a value that is already a field on the row.
- `expected` — **A private helper is defined before the function that calls it, and sibling modules stay symmetric.** The helper's `def` goes above its caller, never below — the reader meets it before the code that depends on it. Two modules doing near-identical jobs keep the same shape and the same order.
- `expected` — **Early terminate; never declare a variable in order to populate it later** (R33). A function does not assign a value and then reassign it under a condition — each branch states its whole case and returns. The named anti-shape is a local initialised to `None` against the chance a later branch fills it in. Distinct from the no-`else` rule above: that one is about indentation, this one is about mutable locals, and it bites where there is no `else` at all.
- `expected` — **No bare variable that exists only to be returned on the next line.** `x = f(...)` then `return x` names nothing the reader did not have from the call. Two deliberate exceptions: naming a SQLModel `statement` before executing it, and a value named to be passed as a constructor argument (`x = [...]`, then `return Schema(data=x)`). The ban is scoped to a name whose only consumer is the `return` on the very next line — a name consumed by a loop, a dict insertion, or more than one expression is a different shape, and review requires assigning it first rather than building it inline (R24).
- `expected` — **Build only what this iteration needs.** No method for a caller that does not exist yet, no field, no flag, no endpoint without a frontend consumer.
- `expected` — **Remove the unused thing *and its whole tail*** — the orphaned exception class with its `ErrorCode`/`ErrorSpec` entry, the redundant enum member, the import and the call it existed for, the index, the endpoint with no caller.

---

## Control flow and failure

- `expected†` — **In `validators/`: guard, and one `if` per failure mode.** Check `None`, missing config, malformed input, and raise a typed exception. A compound `or` guard is split into one `if` per failure mode, even when both raise the same exception, so each mode stays readable and separately raiseable.

  ```python
  def validate_speech_page_size(page_size: int) -> None:
      if page_size < _MIN_PAGE_SIZE:
          raise SpeechPageSizeInvalidException
      if page_size > _MAX_PAGE_SIZE:
          raise SpeechPageSizeInvalidException
  ```

- `expected` — **No `else` after an `if` that exits.** When the `if` raises or returns, the `else` indents the rest of the function for no information. `elif` after an exit is the same defect. Governs every layer.
- `blocking` — **Everywhere else, attempt the operation and catch the failure.** In `services/`, `gateway/`, `crud/` and `middleware/`, wrap the work in `try` and catch at the end. **No LBYL pre-check in front of the attempt, including a cheap deterministic one.** Across the boundary, the validator raises and the caller wraps and catches.

  ```python
  # in a service — no `if report_id is None` in front of the attempt
      try:
          report = _get_validated_report(report_id, session)
      except ReportNotFoundException:
          ...
      except ReportContentInvalidException:
          ...
  ```

- `expected` — **A `None` result is a result, not a pre-check — and `is None`, never a falsy check.** Read this immediately after the EAFP rule; the two are constantly confused. Checking a value you *already hold* and raising is legal everywhere, `services/` included — the operation already ran and you are handling its result. LBYL, banned outside `validators/`, is testing a precondition *in order to avoid attempting* the operation: is the connection open, is the message the right type, does the file exist. Use `is None` explicitly, because a SQLModel object can evaluate falsy in states you did not mean to test for.

  ```python
  # Good — a completed lookup's result, checked
      speech = CRUDSpeech(session).get(speech_id)
      if speech is None:
          raise SpeechNotFoundException

  # Bad — falsy, not `is None`
      if not speech:
          return
  ```

- `expected` — **Exception handling for a fallible call lives in one wrapper beside it.** A high-level function bundles lower-level calls; it does not also handle their exceptions mid-flight or reach into their details. Handling goes in **one** dedicated `_get_validated_*` wrapper next to the call. The ban is on *chains* — a helper calling a helper calling a helper — not on the single wrapper.
- `expected` — **Inside the wrapper, handling is flat: one `except` per type**, narrowest first, ordered specific-to-general. Never group types in a tuple, even when the handler is identical — handlers diverge, and grouping lets the next person change one without splitting the block first. Never delegate the classification to a separate helper.

  ```python
  # flat blocks, general type last
      except UpstreamQuotaExceededError:
          raise UpstreamQuotaExceededException
      except UpstreamUnavailableError:
          raise UpstreamUnavailableException
      except UpstreamError as failure:  # general, last
          ...
  ```

- `expected` — **`except Exception` is not a handler, where the catch decides something** (R41). A blind catch routes the bug it was not written for — a typo's `AttributeError`, a `KeyError` from a renamed field — into the branch built for a network failure, so the real fault surfaces as the wrong `ErrorCode`. That harm is the test: the ban reaches a catch that maps to a domain exception or degrades into a silent default, and **not** one that logs and re-raises, or that contains failure in work whose collapse must not reach the caller. Where a blind catch is right, `# noqa: BLE001` carries a **reason** a reviewer can argue with (`# noqa: BLE001 — the answer must survive any render fault`), never a pointer to the divergence record, which is circular. A `noqa` reason is a suppression's argument, not a comment, so the no-comments rule does not reach it.
- `expected` — **An unexpected condition raises where it is discovered.** It never degrades into an empty list, a `None`, a silent default, a canned answer, or a partially-completed write.
- `blocking` — **One failure mode, one exception.** Every public path out of `services/` fails as an `AppHttpExceptionBase` carrying a distinct `ErrorCode`. A bare 500 is a design defect, and an exception must never imply a scenario that did not happen.
- `blocking` — **Exception classes take no arguments.** A no-arg `__init__` calling `super().__init__(ErrorCode.X)` keeps every message in `exceptions/base.py` instead of scattered across raise sites. Raise without `()`. This governs surfaced exceptions; a private, module-local carrier that never leaves its service may take the arguments it exists to carry (R28).

  ```python
  # note __init__ takes no return annotation
  class SpeechNotFoundException(AppHttpExceptionBase):
      def __init__(self):
          super().__init__(ErrorCode.SPEECH_NOT_FOUND)

  raise SpeechNotFoundException
  ```

- `blocking` — **An external-dependency failure surfaces deliberately, in its subsystem's existing shape.** The invariant: no untyped 500 ever escapes. Which surface — `200` plus a `status` field, or a conventional `502` — follows the convention the subsystem already uses; there is no universal shape. App-layer rejections and internal exceptions keep raising `AppHttpExceptionBase`. **Known gap:** a brand-new endpoint has no precedent to inherit and therefore no default here — it is a review-time decision on that PR, and whoever decides sets the precedent for that subsystem.
- `expected` — **The `error_message` column is diagnostic, and its contents are the writer's call** (R39). It is not the rule below, which governs the message an exception carries to a user. More information is better; the vendor's own prose, a `Type: message` string and a bare category name are all fine.
- `expected` — **An error message is its `ErrorCode` restated in prose.** Second person, sentence fragment, capital first word, terminal period. Name the action that was refused; never speculate about the cause; never instruct the user how to recover; match the phrasing its neighbours at the same status use; keep 404s terse. Two messages never share one string. Never interpolate a fluid runtime number — a count, an id, a limit value — into the text; the message states the error, not the number that happened to trigger it (R24).

---

## Types and data

- `blocking` — **Parse at the boundary before reading a field.** Anything from outside the process — a vendor API, a webhook, a request body — becomes a Pydantic model before any field is read, because dict access fails where the value is used while validation fails where the schema changed. `gateway/` constructs directly with `Schema(**response.json())`; `services/` use `Schema.model_validate(...)`.
- `expected` — **The declared type admits only reachable states.** `Optional[T]` only where the value is genuinely absent or unknown; `""` and `[]` instead of nullability; **no field defaults on `Response`/`Data` schemas** — every field is explicitly populated at construction, because a default hides a field the caller forgot.

  ```python
  # Good
      title: str = ""
      subtitle: str = ""

  # Bad
      speaker_name: Optional[str] = None
  ```

- `expected` — **An id that points at a row is a foreign key, a closed set is an enum column, and no string literal stands in for either.** `Decimal` for money, integer ids across service boundaries.
- `expected` — **Enum value casing follows the enum's origin, until a column persists it.** An internal lifecycle enum's values are UPPER_SNAKE; an enum mirroring a vendor's wire vocabulary keeps the vendor's casing verbatim, so raw payload values round-trip without a case transform. **The carve-out holds only while the enum stays on the wire** (R37): the moment a SQLModel column persists it, its values go UPPER_SNAKE, because SQLAlchemy persists the member *name* and a lowercase value writes a label the Postgres type does not have. A persisted vendor-mirroring enum reads `PRO = "PRO"`; one that mirrors the same vendor, is never persisted, and stays lowercase reads `queued = "queued"`.
- `expected` — **Several values come back as one typed `@dataclass`, never a tuple — and a `@dataclass` is the fallback, not the first move** (R35). Returning one object is first choice; where a method produces a fixed set of scalars, split it into one method per value rather than wrapping the set in a new type. A tuple makes the caller unpack positionally, so adding a field breaks every call site silently, and `row[0]` assumes the value sits where the writer left it.
- `blocking` — **A mapping is never a module-level constant, outside `exceptions/base.py`** (R34). Inline it; past three branches, write an `if`/`return` function instead. A dict is mutable, the alternatives are all noisy or need a library, and a constant defined at the top of the file is read a screen away from the one function that uses it. This is the mapping-shaped twin of the flat-`except` rule: an exception-mapping constant moves the classification out of the `try` entirely.
- `expected†` — **Every fixed literal becomes a named module-level constant.** The name is the documentation and one place changes when the value does. Module-private constants take a leading underscore; constants other modules import do not. A sequence constant is a **tuple**, immutable by construction. Integer literals ≥ 1000 carry `_` thousands separators: `_MAX_BULK_SPEECH_ROWS = 1_000`.
- `expected` — **A comparison against a fixed number names the number.** Inline, `> 14` is a bound with no subject and no place to change it. HTTP status-code comparisons are the noisy class and still want named constants.
- `expected†` — **Anything that varies by deployment is read from `AppSettings` at the point of use** — a default-argument read, not hoisted into a module constant or copied into a local, so it stays overridable and monkeypatchable. Never a secret in code, in `.env.sample`, or in a fixture.
- `expected` — **A model declares its own timestamp default, and its fields come in a fixed order:** primary key, business fields, timestamps, state and boolean fields, foreign key ids, relationships.

  ```python
  class Record(SQLModel, table=True):
      id: int = Field(default=None, primary_key=True)
      name: str = Field(index=True, unique=True)
      created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
      updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

      status: RecordStatus = RecordStatus.ACTIVE
  ```

- `expected` — **A constructed timestamp carries its timezone:** `datetime.now(timezone.utc)`, never the naive `datetime.now()` or the deprecated — and also naive — `datetime.utcnow()`. A naive value written to an aware column is wrong by the host's offset and silent about it.
- `expected` — **A CRUD mutation method runs prepare → set → persist → return**, each phase separated by a blank line. Prepare only where there is something to prepare; the blank lines are what make the phases visible. Where the model declares `updated_at`, prepare always has something: the method sets the clock itself with `datetime.now(timezone.utc)`, and never takes a timestamp from its caller. A batch method computes one timestamp before its loop and writes it to every row (R46).

  ```python
      def archive(self, record: Record, archived_at: datetime) -> Record:
          record.updated_at = datetime.now(timezone.utc)

          record.is_archived = True
          record.archived_at = archived_at

          self.session.add(record)
          self.session.commit()
          self.session.refresh(record)

          return record
  ```

- `expected` — **Filtering, sorting, limiting and batching happen in SQL** — a founding design decision. Name the `statement` before executing it, wrap a multi-line chain in one pair of parentheses (never a `\` continuation), and chain separate `.where()` calls rather than `&`-combining them so each filter reads independently. Bend this only when moving the work would change the result.

  ```python
      def get_by_report_id_and_speaker_id(
          self, report_id: int, speaker_id: int
      ) -> Optional[Speech]:
          statement = (
              select(Speech)
              .where(Speech.speaker_id == speaker_id)
              .where(Speech.report_id == report_id)
              .order_by(Speech.ordinal)
          )
          return self.session.exec(statement).first()
  ```

- `expected` — **`*` goes before a dangerous default — nothing else.** Default to no `*`; add it only where a caller accidentally overriding that default would be dangerous, whatever the parameter's type. Not an arity rule and not a boolean-parameter rule. Do not settle a dispute here by precedent.
- `expected` — **Every signature is annotated, parameters and return alike**, on public functions and private helpers equally — **except a class `__init__`, which takes no return annotation.** That carve-out is not a case-by-case argument: `__init__` never gets `-> None`.

  ```python
  # Good
  class CRUDSpeech:
      def __init__(self, session: Session):

  # Bad
  class CRUDSitting:
      def __init__(self, session: Session) -> None:
  ```

- `expected` — **Pick the construct that compels the caller.** Python's typing is unenforced, so the signature does the work: an enum parameter their LSP flags, a frozen structure that cannot be mutated, a declared response type instead of `dict`, a `Field` that rejects the bad value.

---

## HTTP surface

- `expected` — **A URL names a resource and nothing else.** The action lives in the HTTP method, never in a path segment. Paths are terse and named for the resource; a partial update is `PATCH`, a full replacement is `PUT`.
- `expected` — **Never trust the client.** A security-relevant value is generated server-side, never accepted from the request, and a shared secret is verified before any other work happens.
- `blocking` — **A response, a comment and an example env file reveal the minimum.** Obfuscate which third party failed, expose only closed-enum error categories, keep real resource names out of `.env.sample` and out of code comments, and never let a route path advertise a boundary the code does not enforce.

---

## Comments, diffs and deploys

- `blocking` — **A comment or a docstring is an admission the code failed to say it.** Delete both by default. Exactly three survivors: a `TODO` naming a known-temporary state; a `NOTE` on correct code that looks wrong, explaining *why* rather than *what*; and an inline annotation on an enum member whose triggering condition is **impossible** to infer from the code (R36) — big picture, no implementation detail, eight words. The third is not a softer `NOTE`: a `NOTE` defends code a reader would misread, this one supplies a fact the code cannot contain, namely when a member gets assigned. "Impossible to infer", not "helpful", is the test.
- `expected` — **Where the team has no convention for a mechanism, add nothing.** An ad-hoc `logger` call goes on sight, and a log line whose only justification is debugging convenience is declined; prefer a mechanism that already exists, such as a typed exception per failure mode.
- `expected` — **Match the way it is already done here, even when the local choice is worse.** Settle a dispute by the majority of existing untouched code, name the canonical module to copy from, and raise standardization as its own PR rather than fixing it in passing — the one documented exception being the aware-timestamp rule above, which stops a naive `datetime` from spreading even where the local majority is already naive.
- `blocking` — **A cross-cutting mechanism is implemented everywhere or nowhere.** A mechanism is cross-cutting when its value depends on being applied uniformly, as opposed to a local feature that merely happens to be reusable. A mechanism that spans the codebase — outbound-call timeouts, transaction rollback, retry — ships in one deliberate full-sweep PR that decides it for every site, or it does not ship at all; adding it piecemeal, in whichever PR first happens to need it, is refused at review, and the gap is raised as its own ticket. This is the precondition for the match-local rule above: that rule governs once a local majority exists, this one refuses to let a single PR manufacture that majority for a mechanism new to the codebase (R21).
- `expected` — **Every changed line traces to the ticket.** Revert out-of-scope edits, leave personal tooling and someone else's dependency alone, and say any deliberate gap out loud — a `TODO`, a follow-up ticket, or an explicit "not in scope" — rather than leaving it silent.

---

## Two carried preferences

- **Preference** — **Repeat the comparison in full rather than using `in` / `not in`.** Each condition stays independently readable, and a future condition cannot silently fold into the group.

  ```python
  # Good
      if (
          report.status != ReportStatus.DRAFT
          and report.status != ReportStatus.PUBLISHED
      ):
          raise ReportStatusInvalidException

  # Bad
          if status_code in (401, 403):
  ```

- **Preference** — **`Optional[T]`, never `T | None`.** Chosen for consistency across the codebase; ruff's `UP007` is not enabled here and stays that way. Do not write new `T | None`.

# STYLE-RULINGS.md — the authority behind the style guide

**This file is canonical.** `api/STYLE.md` and `api/CLAUDE.md` are *derived* from it. Where either disagrees with a ruling here, the ruling governs and the document is the thing that needs fixing.

Dropped in the port to hansard: R26, R40, R43, R44 (Kelix-only); Q2, Q3, Q4, Q5, Q6, Q9 (tied to the Kelix review corpus or codebase) and Q7, Q8, Q10, Q11, Q14, Q15, Q17, Q18, Q19 (closed, so nothing is open); the numbers of the kept entries are unchanged.

**It is append-only.** Rulings are numbered `R1`, `R2`, … and never renumbered, never deleted, never silently softened. A ruling that is later reversed is superseded by a *new, higher-numbered* ruling that says so — the original entry stays where it is. Several rulings below already reverse an earlier position; that history is the point of the file.

**A superseded ruling carries a forward-pointer in its own heading**, so a reader who lands on it first cannot act on text a later ruling has overtaken: `· narrowed by **R37**`, `· write half corrected by **R42**`. Append-only preserves the history; the pointer is what stops the history being read as instruction. Whichever ruling does the narrowing adds the pointer to its target **in the same commit**.

**It outranks any re-derivation.** These are the tech lead's decisions — made directly, or, where an entry says so, by explicit delegation and reversible on that basis. When a later document disagrees with this file, this file wins, always, and without re-litigation.

**A delegated ruling narrows a direct one only within R27's bounds:** the contradicting evidence is the lead's own later words in review, the narrowing is scoped to the specific clause rather than the whole ruling, and the entry says plainly that it narrowed a direct ruling and which clause. A delegated ruling that cannot satisfy all three only flags the contradiction as an entry under **Open — awaiting a ruling**; it never acts on it.

## Adding a ruling

Append `R{N+1}` with: the date, the ruling in one bold sentence, the human's own words verbatim where they were given, and, where the rule is about a code pattern, a measured compliance figure against the current tree with its counter-sites named. Then propagate it to every document that states or lists the affected rule, **in the same commit**. Splitting that propagation is how a rule ends up stated in one document and missing from another.

## Where the upstream sources went

The rationale, the review corpus and the history behind these rulings live in kelix-audit (`api/STYLE-REFERENCE.md`, `api/CONTEXT.md`), which are not ported.

---

## Preamble

Authoritative output of the Human Review Gate, 2026-07-28. Ruled by Royce (@roycehoe).

**These rulings outrank every upstream artifact.** Where a ruling conflicts with the philosophy, the concept vocabulary, the ranked standards, or the live `api/STYLE.md`, the ruling governs. Downstream stages may not reopen a ruling, soften it, or restore a withdrawn position.

Seven decisions were put to the human: the six UNRESOLVED standards (UR-01…UR-06 / OV-07…OV-12) and one amendment decision (OV-04). All seven are ruled. The other 45 standards are approved as annotated.

---

## R1 — Shared base schema classes · rules UR-01 / OV-07

**Ruling: the semantic reading.** Not categorical, and not a request-vs-response split.

This is explicitly a judgment call — the human's words: *"this is more of a 'feel' thing."* It therefore ships as prose and must NOT be routed to lint or any mechanical check.

Criteria, as given:

1. If the file is short, a base class is not needed.
2. If the file is becoming excessively long, and defining a base class makes the file more readable by shortening it, a base class may be considered.
3. If the base class has a **1-1 mapping**, it may be considered.
4. **Non-1-1 mapping is generally a bad idea** — using a base class and then extending it forces readers to jump around to find the full definition of the class, on top of the extended values.

The load-bearing rationale in criterion 4 is *locality*: the reader must assemble one definition from two places.

Superseded reading: the categorical *"we do not do `base`"* is scoped by the criteria above, not applied literally.

## R2 — DRY vs. duplicate-rather-than-abstract · rules UR-02 / OV-08

**Ruling: the heuristic holds as stated, and is promoted from inference to doctrine.**

- **Collapse** when the duplication is mechanically identical *and* its meaning is fixed — the same exceptions handled the same way, one exception-to-error-code mapping, two functions differing only by a terminal-status constant.
- **Duplicate** when the copies encode business rules that could plausibly diverge, even if byte-identical today.
- **Same-layer duplication is a HARD rule.** Two peers at the same layer are not collapsed into each other. Where sharing genuinely is right, share from a **lower** layer — never sideways between peers: *"we should not couple one validator to another… If they share functions, it should be from another layer to prevent circular imports"*.

The human's words on strength: *"same layer duplication is hard"*. This is the axis-2 grade for the same-layer clause; the collapse/duplicate judgment itself remains a judgment call.

## R3 — EAFP vs. validate-first guard clauses · rules UR-03 / OV-09

**Ruling: EAFP everywhere except `validators/`. Ships as `blocking`.**

- **`validators/`** — guard clauses raise. Check `None`, missing config, malformed input; split compound `or` guards into one `if` block per failure mode; raise a typed exception.
- **Everywhere else** (`services/`, `gateway/`, `crud/`, `middleware/`) — EAFP. Wrap the work in `try`/`except` and catch at the end. No LBYL pre-check in front of the attempt, **including cheap deterministic ones**.
- **Across the boundary** — the validator raises; the caller wraps and catches.

**Enforcement: `blocking`.** This overrides the earlier grade of `taste`, which rested on every EAFP review thread being a `should` in one PR by one author. The corpus under-read the rule's strength; the human's grade governs.

**A merged guard that tests a precondition is a violation, not an exemplar.** The human's words, on a merged `if message.type is not aiohttp.WSMsgType.TEXT: continue` placed immediately before a `try/except ValidationError`: *"This was a careless mistake. I should not have let a LBYL slip past me. If I could re-review this PR, I would have raised this as a point of contention."* Merged is not endorsed.

## R4 — HTTP surface of an external-dependency failure · rules UR-04 / OV-10

**Ruling: option (c) — invariant plus per-subsystem precedent.**

- **The invariant:** no untyped 500 ever escapes. Every external failure surfaces deliberately.
- **The surface** — `200` + `status`, or a conventional `502` — **follows the subsystem's existing convention.**
- App-layer rejections and internal exceptions continue to raise `AppHttpExceptionBase`.

**WITHDRAWN — must not appear in any downstream artifact.** An earlier ruling in this session distinguished long-running tasks (`200` + `status`) from immediate tasks (raise). The human explicitly backtracked: *"Let me backtrack my decision. I will take c."* The long-running/immediate distinction is **withdrawn** and must not be recorded, cited, or reconstructed. No divergence may be raised on its basis.

**Deliberately left open.** A new endpoint with no subsystem precedent has no stated default. This is a review-time decision. The guide must state the gap rather than invent a default. See **Q1** below.

## R5 — Keyword-only arguments · rules UR-05 / OV-11

**Ruling: settled, NOT pending.** The rule going forward, in the human's words:

> *"default to no `*`, use it only before a dangerous default"*

- The possible arity-based rule (*"if function has more than (x) argument"*) is **no longer under consideration**. Do not label this rule pending, provisional, or awaiting a decision.
- The earlier wording, *"Must use `*` to force keyword-only arguments when a function has optional boolean flags"*, is type-based with a readability rationale and must not be carried forward. The governing rule is **danger-based**: `*` goes before a default whose accidental override is dangerous, regardless of the parameter's type.

## R6 — Where exception handling lives · rules UR-06 / OV-12

**Ruling: confirmed as formulated.** The human's words: *"I accept that wording."*

- Exception handling for a fallible lower-level call lives in **one** dedicated `_get_validated_*` wrapper beside the call, so the high-level function only bundles lower-level functions and never catches mid-flight.
- Inside that wrapper, handling is **flat** — one `except SpecificType:` per type, no tuple grouping, no delegation to a separate classification helper.
- **The ban is on chains** (a helper calling a helper calling a helper), not on the single wrapper.

## R7 — Request-body parameter naming · amends OV-04

**Ruling: two rules, one per layer.** The human's words: *"This is the correct formulation of how I think."*

- **Routers** — the request-body parameter uses the full descriptive name of its schema, never the generic `request`.
- **Services** — the request-body parameter is just `request`. The function's own name carries the request type, so the long schema-derived name is redundant there.
- **`payload` is banned in both layers**: *"We do not use payload in this codebase to refer to a request"*.

---

## Post-audit rulings (R8–R11)

A first draft of the guide returned **ESCALATE — NOT SHIPPABLE**, with 3 internal contradictions. Two were gaps in the rulings above rather than drafting errors, so they were put back to the human. Ruled 2026-07-28.

### R8 — What `validators/` is · resolves contradiction 1

**Ruling: R3's carve-out attaches to the DIRECTORY, not to a kind of function.**

`validators/` can hold two shapes. The second is misplaced:

- **(a) pure input validators** — check already-loaded state and raise (`get_validated_user`). Guard clauses. Correctly located.
- **(b) wrappers around an outbound call** — wrap the call and map failures to typed exceptions. The human's words: *"it will eventually be placed in gateway; refactoring ticket."* (Destination superseded by **R20**.)

R3 therefore stands exactly as written. Type-(b) functions must not be used to weaken or re-scope R3.

Independent of where such a wrapper ends up living, it must not use a tuple-grouped `except (ConnectionError, Timeout, TooManyRedirects):` (against the rule *"Never group exception types in a tuple, even when the handler is identical"*) or `if status_code in (401, 403):` (against *"Always repeat the full comparison"*).

### R9 — `if x is None: raise` is not LBYL · resolves contradiction 2

**Ruling: state the distinction explicitly in the guide.** The human's words: *"yes, state it explicitly."*

- **NOT LBYL, and legal everywhere** — checking a value you *already hold* (an `Optional` returned by a lookup) and raising. That is handling a completed operation's result.
- **LBYL, forbidden outside `validators/` per R3** — testing a precondition *in order to avoid attempting* an operation: is the connection open, is the message the right type, does the file exist.

This must be stated, not left implicit. A reader applying R3 literally without this distinction would delete every correct `if x is None: raise` guard in `services/`.

### R10 — The single-use-helper ban is a conjunction · resolves contradiction 3

**Ruling: the ban applies only when BOTH conditions hold.** The human's words: *"yes, the conjunction is right."*

As actually written in review: *"If this helper function is only used once, **and** the logic is not very complicated, does it make sense to still make it a helper function?"*

It must ship as the conjunction, not as an absolute ban on "a function that only wraps another", which would collide with R6's mandated wrapper. No carve-out for R6 is needed, because R6's wrapper fails both conditions: it is called more than once and carries real branching with many typed `except` branches.

### R11 — C44 Tool-Owned Formatting is OMITTED · resolves the enforcement gap

**Ruling: do not ship C44.** The human's words: *"c; refactoring ticket."*

Basis: the rule asserted formatting is the tool's call, but in the source codebase no tool had the call. R11 stands as the reason the guide carries no formatting rule beyond naming the tool.

> **Later:** R14 chooses the tool, `ruff format`.

---

## Later rulings (R12–R13) — 2026-07-28, after the guide was first installed

Both of these REVERSE a standard the corpus supported. They are the human's word and they govern.

### R12 — `validated_` / `unvalidated_` prefixes are DEPRECATED

**Ruling: the rule is deprecated. Remove it — do not narrow it, do not keep it for `validators/`.**

This supersedes **OV-05**, which recorded it as a NARROWING (scoped to validator modules). The narrowing is no longer the governing position; the prefix convention is dropped outright.

Deprecation is the continuation of the direction review already showed: *"The service layer, already a very complicated layer, should not concern itself with keeping track of what is and isn't validated through variable names"*, and *"don't do unvalidated/validated. Just call the variable `user_document` and then validate it. Reassigning is confusing"*. R12 completes that arc.

The `get_validated_*` **function** naming convention is unaffected. No new code adds the prefix, and no document may present one as a model to follow.

### R13 — a class `__init__` does NOT get a return annotation

**Ruling: never annotate the return type of `__init__`. Write `def __init__(self, session: Session):`.**

This is a carve-out from the annotate-every-signature rule, not an exception to be argued case by case. The annotate-everything rule continues to apply to every other function, parameters and return type alike, including private helpers.

**Consequence for ruff work, which must not be missed.** `ANN204` (`missing-return-type-special-method`) is precisely the check that demands `-> None` on `__init__`. Under R13 it **must never be enabled**, because it would enforce the opposite of this ruling.

**Open, not decided here:** R13 names `__init__`. Other special methods (`__str__`, `__repr__`, `__enter__`) are not addressed. See **Q12**.

---

## R14 — `ruff format` is the formatter · 2026-07-29

**Ruling: `ruff format` from now on, replacing `black`.**

This closes the gap R11 identified. R11 withdrew the tool-owned formatting rule from the guide because no Python formatter was enforced anywhere. R14 chooses the tool.

**Why `ruff format` over `black`:**

- `ruff` is already the linter, so this adds a mode of an installed tool rather than a second tool. One formatter, one linter, one binary.
- Smaller migration in the codebase this was decided for.

**Consequence for the guide: no new prose rule.** Once formatting is tool-owned, it needs no rule in `api/STYLE.md` at all; the withdrawn C44 does not come back as prose. The tool owns it, so the document says nothing about it beyond the blank-line rule, which is semantic phrasing rather than layout.

In hansard, `ruff format` is enforced from the start: run it before every commit.

## R15 — One-expression CRUD instantiation is doctrine · 2026-07-29

**Ruling: instantiate CRUD and call the method in a single expression. Never bind the instance to an intermediate variable.** The human's words: *"We use the CRUD class directly like so `user = CRUDUser(session).get(user_id)` … and never like this `crud_user = CRUDUser(session); user = crud_user.get(user_id)`. This is an established codebase pattern."*

It is kept as an `expected` rule in `api/STYLE.md`.

**Rationale, as originally written and still governing:** the CRUD instance holds no reusable state, so the intermediate name buys nothing while implying that it does. The service layer remains responsible for deciding and preparing values — pass already-prepared values to the CRUD method rather than letting CRUD derive them.

Where a rule reads as doctrine and the tree agrees, keep it rather than dropping it for want of a review thread. High compliance is not evidence the pattern is automatic, so the rule stays resident.

## R16 — Enum value casing: internal lifecycle UPPER_SNAKE, vendor-mirroring keeps the vendor's casing · 2026-08-08 · narrowed by **R37**

**Ruling: an internal lifecycle/status enum's values are UPPER_SNAKE; an enum that mirrors a vendor's wire vocabulary keeps the vendor's casing verbatim.** Recorded so nobody "fixes" a vendor enum's casing and silently breaks wire-payload round-tripping. The lowercase values exist so raw vendor payloads parse without a case transform.

## R17 — `gateway/` may import from `utils/`; it is how two gateways share · 2026-08-13

**Ruling: a `gateway/` module may import a pure helper from `utils/`, and that is the required way for two gateway modules to share one.** The review comment that set the shape: *"Each gateway file should connect to one service and one service only … On the utils level, we would have pure functions that helps with both layers."*

This is not a new permission so much as a recorded one. The layer table states of `utils/`: *"Pure utility functions with no side effects. **Any layer may import from here.**"* The ruling exists because an absence of examples reads as a prohibition to the next reader.

**R2 does not merely permit this, it requires it.** Two gateway modules are peers at one layer. R2's same-layer clause is `blocking`: peers are never collapsed into each other, and where sharing is right it comes from a **lower** layer. So the two available alternatives, putting the helper in one gateway and importing it from the other, or factoring a third gateway module to hold it, are both the violation. `utils/` is the lower layer, and is the only conforming home.

**The standing constraint: `utils/` must not import from `gateway/` or any layer above it.**

**What this ruling does not license:** a `gateway/` module reaching into `utils/` for anything that is not a pure helper, and in particular anything that would pull `database/` or a `Session` in behind it. If the thing two gateways need is not pure, it is not a `utils/` candidate and the sharing question is still open.

## R18 — `_should_` for a prospective decision, `_is_` for a present state · 2026-08-13

**Ruling: a private boolean helper that decides an action not yet taken takes `_should_`; `_is_` is reserved for a predicate about a state that already holds.** Both return a boolean, and both are pure — the affix carries the tense, not the return type.

The human's words, ruling on a helper that decides where to route a document that has not yet been parsed: *"`should` is fine, because it is obvious from this prepend that the function will return a boolean value. `is` here changes the semantic meaning of the function because it presumes the action has already taken place."*

Renaming such a helper to `_is_document_parsed_by_<vendor>` was attempted and reverted: that name asserts the parse already happened, which is false at every call site, so the `_is_` form is not a stylistic variant but a different and wrong claim.

**Scope.** This governs the private-helper affix only. It does not touch the `is_` rule for boolean *variables and parameters*, which is unconditional: a boolean variable takes `is_` whatever its tense.

## R19 — A private helper is defined before the function that calls it, and sibling modules stay symmetric · 2026-08-22

**Ruling: a private helper's `def` goes above the function that calls it, never below; and two modules doing near-identical jobs keep the same shape and the same order.** This is the inverse of the stepdown rule, chosen deliberately — the reader meets the helper before the code that depends on it.

It resolves the way **R15** set the precedent for: where a rule reads as doctrine and the tree agrees, keep it rather than dropping it for want of a review thread.

**The symmetry half is prose-only and stays that way.** No linter can judge whether two modules "do near-identical jobs", so it is not queued for tooling and must not be flattened into a mechanical check.

## R20 — The outbound-response wrappers move to `services/`, not `gateway/` · 2026-08-22 · governed by **R27**

**Ruling: the `get_validated_*_response` wrappers belong in `services/`, as private `_get_validated_*` helpers beside their call site — not in `gateway/`.** This supersedes only the destination clause of **R8**, whose words were *"it will eventually be placed in gateway; refactoring ticket."* R8's finding that the wrappers are misplaced in `validators/` stands unchanged; only where they land has changed.

**`gateway/` is ruled out by review evidence:** *"This is not how we write our gateway modules. There should be no parsing of received objects here. All this module does is expose external services which other modules can consume."* A gateway that may not interpret a failure cannot also host a wrapper whose entire job is interpreting one.

**`middleware/` does not qualify either.** Review set `middleware/`'s criterion as spanning multiple services: *"On the middleware layer (since this is something that spans multiple services)…"* Each wrapper serves exactly one vendor for one calling service, so it fails that test.

**The ruled destination: the calling module in `services/`, as a private `_get_validated_*` helper beside the call.** It reconciles three rules that already ship rather than adding a fourth: the gateway stays call-and-construct, validators stay pure, and "exception handling for a fallible call lives in one wrapper beside it" (R6) already names this exact destination.

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

## R21 — A cross-cutting mechanism is implemented everywhere or nowhere · 2026-08-22

**Ruling: a mechanism that spans the codebase — outbound-call timeouts, transaction rollback, retry — is implemented across the codebase in one deliberate PR, or not at all.** A partial implementation added in whichever PR first happened to need it is refused at review, and the gap it exposes is raised as its own ticket rather than patched locally.

The position was stated in review in the author's own words: *"Remove these timeouts; out of scope. We have not yet decided how to delegate timeouts for external services."*; *"If it is implemented, it should be implemented collectively throughout the entire repo, and not just here."*; *"Either we do a full sweep of our code and decide how to handle such situations, or we don't do it at all."* Whoever needs the mechanism first does not get to unilaterally decide its shape for everyone downstream.

**Interaction with *Match the way it is already done here*.** That rule resolves a dispute once a local majority exists — it tells you to copy the majority even when the majority is worse. R21 governs the step *before* a majority exists: no single PR gets to manufacture one by shipping the first instance of a new cross-cutting mechanism. Once a full-sweep PR has actually decided the mechanism for the whole codebase, *Match the way it is already done here* takes back over and governs which shape a new site copies.

**Caveat to *Every fixed literal becomes a named module-level constant*.** That rule governs how to *name* a timeout that already exists. It is not licence to *add* one: adding a timeout is introducing a cross-cutting mechanism, and R21 governs that decision first.

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

**Amendment — "cross-cutting" gets a decidable test, and the `blocking` grade is confirmed.** The tech lead's words: *"keep blocking with the definition."* A mechanism is cross-cutting when its value depends on being applied uniformly — outbound-call timeouts, transaction rollback, retry — as opposed to a local feature that merely happens to be reusable. The definition exists because R21 was the fuzziest of the guide's `blocking` rules, and a `blocking` rule that can be argued at the margin is one that will be; the test makes the grade decidable rather than a judgement call at review time. The grade is justified by the evidence's own shape: the timeouts were not merely criticised but removed at review's demand, and a demanded revert is a block in substance whatever the platform recorded.

*The ruling above was delegated; the amendment is not. Amended 2026-08-22 by the tech lead.*

## R22 — A gateway calls and constructs; it does not interpret · 2026-08-22

**Ruling: a gateway module wraps exactly one external service, takes its request schema already built, performs the call, and constructs the response model — nothing else.** It raises no domain exception, catches no vendor error, and interprets no failure; the caller owns all of that.

The shape, end to end:

```python
def create_export_job(request: CreateExportJobRequest) -> CreateExportJobResponse:
    response = requests.post(
        url=f"{AppSettings.EXPORT_BASE_URL}/jobs",
        headers={"X-API-KEY": AppSettings.EXPORT_API_KEY},
        json=request.model_dump(by_alias=True),
    )
    response.raise_for_status()
    return CreateExportJobResponse(**response.json())
```

Evidence, quoted verbatim from review:

- *"This is not how we write our gateway modules. There should be no parsing of received objects here. All this module does is expose external services which other modules can consume… look at [the purest gateway] for the purest implementation of this idea."*
- *"Each gateway file should connect to one service and one service only… 1. Create one gateway for [each vendor]. 2. On the middleware layer (since this is something that spans multiple services), we would have the middleware module that composes the correct gateway functions. 3. On the utils level, we would have pure functions that helps with both layers."*
- *"one-liner function. Do this inline where it is consumed."*

**This does not contradict the shipped *A gateway is named for the concrete action and returns a parsed model* rule — it sharpens it.** Constructing the parsed model *is* the gateway's job. What R22 removes is the extra work layered on top of that construction: catching a vendor exception, mapping it to a domain exception, handling a `ValidationError`.

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

## R23 — A concern consumed by more than one service belongs in `middleware/` · 2026-08-22

**Ruling: a concern consumed by more than one service is not a service — it goes in `middleware/`, which composes the correct `gateway/` calls; `utils/` holds the pure helpers both layers share.**

Ruled on review comments that name the same distinction independently: *"Move this to a middleware since this spans (ie. intercepts) multiple services"*; *"Each gateway file should connect to one service and one service only… On the middleware layer (since this is something that spans multiple services), we would have the module that composes the correct gateway functions. On the utils level, we would have pure functions that helps with both layers."*

**This widens `middleware/`.** `middleware/` is not only the registered request-path half (security, request timing, logging, rate limiting registered in `main.py`). It is also where a concern spanning multiple services is composed from `gateway/` calls, independent of whether it is registered on the FastAPI request pipeline.

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

> **Later:** R29 refines the criterion — membership is decided by composition (what the module does), with consumer count as evidence only.

## R24 — Five clause-level amendments to existing rules · 2026-08-22

**Ruling: five clause-level amendments, one ruling.** Each sharpens an existing `api/STYLE.md` rule with a boundary, a carve-out, or an added clause surfaced in review. None re-decides a rule already ruled; each extends one that stands.

### (a) The bare-variable ban's boundary

**The ban on a bare variable before `return` applies only when the name's sole consumer is that `return`, on the immediately following line.** A name consumed by a loop, a dict insertion, or more than one expression is a different shape — it is wanted, and review requires assigning it first rather than folding it into the loop or the insert.

- *"Assign first… Then loop over"*
- *"Assign first to a variable before inserting into a dictionary. This way of writing is very confusing"*
- *"Why do we create a dictionary and then loop over the dictionary? … Zen of python: Namespaces are a honking good idea"*

Before this ruling the two rules read as a contradiction — one banning a bare intermediate variable, the other demanding one in front of a loop. The boundary is `return x` versus `for … in x`.

### (b) The single-use-helper rule's carve-out

**A one-line helper is legitimate, even when both conjunction conditions hold, when its name carries meaning the code cannot express on its own.** The name stands in for the comment the no-comments rule forbids — this reconciles the two rules rather than leaving them in tension.

From review: *"Do not use helper functions to wrap one-liners; doing so is a sign of overabstraction (unless the function name is used as a comment for a one-liner whose purpose cannot be implied solely by reading code)"*.

### (c) No `or` in a function name — name it for the end goal, not the branches

**A function name never joins its branches with `or`; it names the end goal the function serves.** The same defect, read from the other direction, is a name that omits what the function actually does.

- *"We don't use `or` in function names because, on one hand, yes it describes what this function does (get either `a` or `b`). But the what is irrelevant. The function name should, instead, be centered around the end goal."*
- *"This function is not truthful about what it does. This function does not only `_get_stored_report_blob_path`, but also uploads a report to a blob."*

### (d) No fluid (interpolated) numbers in an error message

**An error message never interpolates a runtime number** — a count, an id, a limit value. The message restates the `ErrorCode`, not the specific figure that happened to trigger it.

From review: *"noted. I'll refrain from adding fluid numbers in error descriptions."*

### (e) Drop a qualifier the name already implies

**A name drops a qualifier that only restates what its own context already carries** (`requested_query_mode` on a request-scoped field → `query_mode`). Same family as the deprecated `validated_`/`unvalidated_` prefix — a name recording provenance the surrounding context already makes obvious.

From review: *"This should just be called `query_mode`. The 'requested' part is implied."*

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

## R25 — The no-comments rule rises from `expected` to `blocking` · 2026-08-22

**Ruling: grade change only — the rule's text is unchanged.** `api/STYLE.md`'s "A comment or a docstring is an admission the code failed to say it" moves from `expected` to `blocking`.

**Evidence.** Review re-asserted the rule eight times across three PRs. The full statement: *"We do not write comments when writing code. The code should be the comment. If that is not possible, the helper function name should be the comment. Only if all else fails, a comment should be written (ie. almost never)"*. Seven more removal-instruction threads carry the same rule without restating it.

**Enforcement: `blocking`.** The corpus-era grade was `expected` on the strength of the rule reading as doctrine; review conducted since has enforced it as a blocker repeatedly, which is a stronger and more recent signal.

**Unchanged by this ruling.** The two originally licensed survivors — a `TODO` naming a known-temporary state, and a `NOTE` on correct code that looks wrong — stand exactly as written. R36 later adds a third.

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

**Confirmation — the grade holds.** The tech lead's words: *"keep blocking."* Two reasons were accepted. The rule is crisply decidable — a comment either is a `TODO`, or a `NOTE` on correct code that looks wrong, or it goes — so it needs no added definition. And the remedy is free — deleting a comment costs the author nothing, so a `blocking` grade adds no real friction. A `blocking` rule that accumulates carve-outs is worse than an `expected` one people respect, which is why R36 sets a deliberately high bar.

*The grade rise above was delegated; the confirmation is not. Confirmed 2026-08-22 by the tech lead.*

---

## R27 — When a delegated ruling may narrow a direct one · 2026-08-22

**Ruling: a delegated ruling MAY narrow a direct human ruling, subject to three constraints — all of which must hold.** The tech lead's words: *"allow it, with those three constraints."*

1. The contradicting evidence must be the lead's **own later words in review** — not an inference, not a third party's comment.
2. The narrowing must be scoped to the **specific clause**, not the whole ruling.
3. The entry must **say plainly that it narrowed a direct ruling, and which clause.**

**The converse holds too.** A delegated ruling that cannot satisfy every constraint may only FLAG the contradiction as an entry under **Open — awaiting a ruling** — it never acts on it.

**R20 is the first ruling made under this constraint, and satisfies each one:** its contradicting evidence is the lead's own later review words; it supersedes only R8's destination clause, leaving R8's misplacement finding untouched; and its entry says so inline, quoting R8's words before superseding them.

**Rationale, as accepted by the lead.** The alternative leaves the docs knowingly instructing the next author toward a layer that has since been ruled out. A delegated ruling is cheap to reverse — a higher-numbered ruling undoes it — whereas a stale instruction someone acts on is not.

**This is a constraint on the ruling process itself, not a code-pattern rule, so no tree-compliance measurement applies.**

*Ruled 2026-08-22 by the tech lead.*

## R28 — A surfaced exception and an internal carrier are different categories · 2026-08-22

**Ruling: an exception that surfaces out of `services/` and an exception used module-internally as an error carrier are different categories, and only the first is governed by the no-arguments rule.**

- A **surfaced** exception is an `AppHttpExceptionBase`: it takes NO arguments and carries an `ErrorCode`. The `blocking` *Exception classes take no arguments* rule governs it, unchanged.
- An **internal carrier** is private, module-local, and never leaves its service. It MAY take arguments, because carrying them is its whole purpose. It must be the narrowest thing that works, and it is not reached for where a plain value would do.

**This does not narrow the no-arguments rule.** It names a category that rule never covered: the rule's rationale, keeping every user-facing message in `exceptions/base.py`, has no purchase on an exception no user-facing message is derived from. Because nothing is narrowed, R27's constraints are satisfied trivially.

**The discomfort is recorded honestly.** The lead's own words on such a carrier: *"I'm starting to dislike this class implementation. Anti-pattern since we can just pass values as arguments… Why is this the only service with a class? Why a private class?"* It was non-blocking and left unresolved. Its stated remedy is incompatible with the raise-don't-degrade doctrine, which is `blocking`: values cannot be passed out of a `raise`, and the alternative would be returning a result object instead of raising. It is a standing `taste`-weight preference against reaching for a carrier where a plain value suffices, not a defect in a carrier that is needed.

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

## R29 — `middleware/` membership is decided by composition, not consumer count · 2026-08-22

**Ruling: a module belongs in `middleware/` when it composes calls across two or more gateways or services. What the module does decides its home; how many callers it has is evidence of that, never the test.** R23's "consumed by more than one service" is a sufficient condition, not a necessary one.

Applying the criterion: a module that imports a vendor SDK client directly and holds no `gateway/` import does not compose a gateway, it is one, misfiled; under R22 the vendor SDK client belongs in `gateway/`. A module that parses and logs for a single service composes nothing across gateways or services and belongs beside its consumer in `services/`, or in `utils/` if pure.

*Ruled 2026-08-22 under explicit delegation. Reversible by a higher-numbered ruling.*

## R30 — CRUD is business-logic-free: no hard-coded filter or field value, and names drawn from columns · 2026-09-15 · **write half corrected by R42** · **naming clause retired by R47**

**Ruling: a CRUD method never hard-codes a value that encodes a business rule.** Every filter value and every field value it writes arrives as a parameter, and the method is named for the columns it touches, not for the concept the service is expressing. A method that queries `role = PRIMARY AND status = PENDING` is `get_count_by_created_by_id_and_role_and_status(created_by_id, role, status)`, not `get_in_flight_query_answer_count_by_created_by_id`.

**The tech lead's own words:**

> *"CRUD classes should only be aware of the various CRUD operations and nothing more; business logic should not cross into the CRUD layer... `get_all_stale_tickets_in_use_by_created_by_id` — there is business logic encoded into this CRUD method. Because now the CRUD method is aware that there is something called 'stale tickets in use', which is a purely service level/business rule. Instead, this should be written to `get_all_by_status_and_created_by_id`."*
>
> *"Let's also talk about the `mark_ticket_in_use` and `mark_ticket_failed` and so on. Again, the CRUD method is now aware of business logic, that when a ticket fails, it should change certain attributes of a ticket. This should not be the case. The CRUD method should be called `update_ticket` or something like that, with the fields that users want to update passed in as arguments. And if doing so gets verbose on the service level, they should be helper methods on the service layer."*
>
> *"The moment business logic crosses into the CRUD layer, it makes the separation between CRUD operations and service level logic difficult to separate, which is not what we want."*

**Three sub-positions, each separately evidenced in review:**

1. **Names use column vocabulary.** *"CRUD methods should be service level agnostic. method should not know what 'in flight' means. It simply returns a count based on filter(s)"*.
2. **CRUD returns ORM objects or primitives, never a composite it built.** *"crud should not be responsible for holding any schema related classes; it should, as far as possible, return just SQLModel objects or primitive data types. CRUD should not be responsible for building new composite datatypes"*.
3. **CRUD returns nothing it has no consumer for.** *"should this function return anything at all? Are there any consumers that use the output of this function?"*

**The canonical fix pair.** Hard-coded predicates became parameters:

```diff
-    def get_in_flight_speech_count_by_created_by_id(
-        self, created_by_id: int
+    def get_count_by_created_by_id_and_role_and_status(
+        self, created_by_id: int, role: SpeechRole, status: SpeechStatus,
     ) -> int:
-            .where(Speech.role == SpeechRole.PRIMARY)
-            .where(Speech.status == SpeechStatus.PENDING)
+            .where(Speech.role == role)
+            .where(Speech.status == status)
```

*Ruled 2026-09-15 under explicit delegation. The quoted position is the tech lead's own, verbatim. Reversible by a higher-numbered ruling.*

## R31 — A name is guessable from the import path alone · 2026-09-15

**Ruling: a reader who has only the import path and the name must be able to guess what the thing is and how it is grouped.** A name that is spelled out in full and still names a shape, a container, or a metaphor rather than the domain fails this, and the existing "spell the domain object out in full" rule does not catch it.

**The tech lead's own words:**

> *"Graph is vague. What does graph refer to? Do not be lazy when naming variables; mantainers should be able to guess what an enum or variable refers to, and how it is grouped, simply by looking at the import path and the enum/variable/function name."*

**The largest cluster in review: 17 threads across 8 PRs.** Every rejected name is a real English word that describes the container rather than its contents:

| Rejected | The objection |
|---|---|
| `envelope` | *"it fails to describe what the envelope contains, other than, it holds multiple pieces of data. Secondly, it is implied that this object would hold multiple pieces of data because....well it is an object"* |
| `resolved` | *"what constitutes 'resolved'? This function isn't clear. What is it resolved for?"* |
| `drain` | *"can we use a better word other than `drain`? This word is opaque to its meaning"* |
| `turn` | *"is `turn` a cannonical word according to the codebase?"* |
| `owned` | *"what does 'owned' mean? Who owns it?"* |
| `stranded` | *"what is stranded? Is there a better word to describe this that is canonical in the codebase?"* |
| `touch` | *"the heck is touch"* |
| `pair` | *"don't be lazy with variable names. spell the whole thing out. Pair. of. what?"* |
| `cohort` | *"unclear variable name. What is a cohort?"* |
| `data` as a wrapper | *"Why are we wrapping this in `data`?"* |
| `chars` | resolved to `char_count`: *"it was the length, not the characters"* |

**One corollary, separately evidenced: a vendor's product name is an implementation detail and never reaches a module or function name.** *"Are we resending emails or is this the first time we are sending emails? Yes we are using the 'resend' API, but the function/module name should represent what is being done, not what the API says. The API name is simply an implementation detail."* This sharpens the shipped *"A gateway is named for the concrete action"* rule rather than standing alone.

**Grade: `expected`.** It is a judgement call by construction — no linter can decide whether a word is guessable — and review raised it as a question (*"can we use a better word"*) as often as an instruction.

*Ruled 2026-09-15 under explicit delegation. Reversible by a higher-numbered ruling.*

## R32 — A pure function lives in `utils/`, and takes the values it reads rather than the object · 2026-09-15

**Ruling, in two parts.**

**Part one: a pure function belongs in `utils/`, and a function is never defined inside another function.** Stated in review as standing: *"pure function. Put in utils. Function should only take in idp and iss values instead of claims object. This should be standard from now on. Pure functions go into utils."* And for the nested-`def` half: *"we do not define functions within functions. Move these out"*, then *"since these are all pure, move them into a utils module."* Both halves generalise.

**Part two, ruled directly by the tech lead: a function takes the values it reads, and takes the object only once that would mean three or more arguments.** The tech lead's words, 2026-09-15:

> *"Validators should ideally avoid taking in objects; validators should take in as little information as possible. They should take in primitive arguments. However, if the number of primitive arguments grow to disproportionately large numbers, it would make sense to simply pass the object. Let's cap it at 3 or more arguments."*

Read the cap as the trigger to switch: at two primitives, pass primitives; at three or more, pass the object.

**The reasoning, in review:**

> *"Functions should only take in as much information as it needs to execute and nothing more. Passing the user object into this function is an antipattern because it signals to readers that this function REQUIRES the whole user object, which is misleading. Good functions should be written in such that looking at the function name and arguments leave little ambiguity on what it does, and readers can guess its implementaion."*

Its fix pair is the exemplar, two fields read, so two primitives:

```diff
-    speaker_to_add: Speaker,
+    speaker_to_add_id: int,
+    speaker_to_add_party: str,
```

**This narrows a shipped rule, and says so per R27.** The earlier *"A validator that needs a row is handed the row"* now governs only the three-or-more case. The narrowing is scoped to that clause; the rest of the validators-and-`utils/` rule — no session, no I/O, no hidden mutation — is untouched. The narrowing is the tech lead's own, stated directly rather than inferred, so R27 is satisfied on all three counts.

*Part one ruled 2026-09-15 under explicit delegation; part two ruled directly by the tech lead. Reversible by a higher-numbered ruling.*

## R33 — Early terminate; never declare a variable in order to populate it later · 2026-09-15

**Ruling: a function does not assign a variable and then reassign it under a condition. It returns early instead.** The specific banned shape is a local initialised to `None` against the chance that a later branch will fill it in.

**The tech lead's own words:**

> *"Early terminate. Don't assign and reassign variables as it make things difficult to read. A maintainer of this function will need to, from the get go, bear the cognitive load of 3 variables they anticipate might change over the course of this function. Early terminate sidesteps this. It may be more verbose, yes. But it becomes very clear how we are handling each case."*
>
> ```
> if {condition}:
>    return {build_it_one_way}
> return {build_it_the_other_way}
> ```

The anti-shape named outright: *"This is a code smell. Assignment to None, on the chance that this variable might be populated. See how this is done cannonically in the codebase."* Five threads across five PRs re-asserted it: *"always favor early termination. Please return early"*, *"shouldn't we just return directly in the block above?"*.

**Distinct from the shipped "No `else` after an `if` that exits."** That rule is about indentation after a branch that has already left. This one is about mutable locals, and it bites in functions with no `else` at all.

*Ruled 2026-09-15 under explicit delegation. The quoted position is the tech lead's own, verbatim. Reversible by a higher-numbered ruling.*

## R34 — A mapping is never a module-level constant, outside `exceptions/base.py` · 2026-09-15

**Ruling, written as one by the tech lead in review:**

> *"Here is a ruling: Except for exception base.py, we absolutely do not do mappings as constants. Mappings as constants are typically defined at the top of the file. Unless it were to immediately precede the function that uses it, readability suffers. Furthermore, dictionaries are mutable data structures and all other alternatives are visually noisy and look unintuitive, or require external libraries like FrozenDict (ie. solutions are all unintuitive). Let's make this simple. Either do it inline, or if it is sufficiently complex (ie. more than 3 switch cases), create an if/else function."*

So: inline it, or past three branches write an `if`/`return` function. Three more threads apply it:

- *"we don't do this. The codebase pattern is to catch an error and manually throw it; creating a mapping is intuitive since there are many errors to catch and throw, yes, but it creates another layer of unnecessary abstraction. When things fail, I would like to be able to see exactly where it fails with as little need for indirection as possible."* The mapping constant was deleted, five flat `except` blocks in its place.
- A `_REPORT_TYPE_TO_PARSER` constant replaced by a `_get_parser(report_type: ReportType)` function using the same `if`/`return` shape as its neighbour.
- A hand-rolled `_and_all` fold deleted for SQLAlchemy's own `and_(*filters)`.

**The exception-mapping case is where this rule and R6 meet**, and they agree: R6 already forbids delegating exception classification to a separate helper. A mapping constant is the same defect one step further out, because it moves the classification out of the `try` entirely.

**Not governed by this ruling: a set of constants.** The same reviewer rejected that shape too — *"please don't do this. don't create sets with constants. Just use the constants directly"* — but on one PR, so it is recorded as **Q21** rather than ruled here.

*Ruled 2026-09-15 under explicit delegation. The ruling text is the tech lead's own, verbatim, including the word "ruling". Reversible by a higher-numbered ruling.*

## R35 — Never return a tuple; split the method before reaching for a `@dataclass` · 2026-09-15 · sharpens the shipped never-a-tuple rule

**Ruling, declared as new by the tech lead:**

> *"new rule. Never return tuples. Either have a function that returns an object (ie. dataclass) or return one object. Returning a dataclass should be a last resort."*

`api/STYLE.md` already carried *"Several values come back as one typed `@dataclass`, never a tuple."* **What this adds is the ordering**: returning one object is first choice, a `@dataclass` is the fallback, and the tuple is never. Where a method produces a fixed set of scalars, the canonical fix is to **split it into one method per value**, not to wrap the set in a new type.

**The exemplar** — five composite-returning methods became fourteen single-value ones:

```
get_speech_summary       -> get_speech_count, get_speech_total_word_count
get_attendance_counts    -> get_present_attendance_count, get_absent_attendance_count
get_corpus_size          -> get_corpus_report_count, get_corpus_speech_count, ...
```

**The second half, on positional reads:**

> *"returning a list of tuples is typically a very big code smell. We type our objects whenever we can."*
>
> *"`row[0]` and `row[1]` leaves room for an index error. Obtaining values via indexing is typically a huge code smell because it assumes that the exact data you need resides in the exact position (which is why the cannonical solution is to use plain ol' objects like dataclasses and the likes which makes errors a little more obvious)."*

**This is consistent with R30's ban on CRUD building composites, and the two together decide the CRUD case:** a CRUD method that would return several scalars splits into several methods. It neither returns a tuple nor builds a `@dataclass`.

*Ruled 2026-09-15 under explicit delegation. The quoted position is the tech lead's own, verbatim, including "new rule". Reversible by a higher-numbered ruling.*

## R36 — A third licensed comment: an enum member whose trigger cannot be inferred from code · 2026-09-15

**Ruling, made directly by the tech lead.** Asked whether the two instances of an explanatory enum-member comment stay undocumented or become a carve-out, his answer, 2026-09-15:

> *"The rule is, it is impossible to infer from the code when FLAGGED_FOR_REVIEW_REUSED_EMAIL [occurs] given how obscure this error is. This justifies its place."*

**So the comment rule now has three survivors, not two:**

1. A `TODO` naming a known-temporary state.
2. A `NOTE` on correct code that looks wrong, explaining *why*.
3. **An inline annotation on an enum member whose triggering condition cannot be inferred from the code at all.**

**The third is a different justification from the second, which is why it could not fold into `NOTE`.** A `NOTE` defends code a reader would otherwise think is a bug. This one attaches to code nobody would misread, and supplies a fact the code does not contain and cannot contain: *when* a member gets assigned. The enum member is a name and a string; the condition that produces it lives in a service, or in a vendor's behaviour, or in an operator's judgement. No amount of renaming carries it.

**The bar, and it is deliberately high.** "Impossible to infer from the code" is the test, not "helpful". The comment is big-picture and carries no implementation detail, per the instruction that produced it: *"write a comment, no more than 8 words, on when `FLAGGED_FOR_REVIEW_REUSED_EMAIL` will occur; it should be a big picture sort of comment, and should not contain any implementation details."*

**Eight words is the recorded budget.** It is the only number the lead has given for a comment's length, and it is what keeps the carve-out from widening into prose.

**The second instance sets the vendor case:** *"This comment belongs to the enum instead in the enum module. Do it inline, abbreviated, like this:"*

```python
class ExportSplit(StrEnum):
    AUTO = "auto"
    INPUT_TEXT_BREAKS = "inputTextBreaks"  # splits on \n---\n and ignores page_count
```

A vendor's behaviour behind one of its own enum values is the same category: not inferable from this repo's code at any distance.

**R25's grade is untouched.** The no-comments rule stays `blocking`. That warning is honoured by the bar, not by refusing the carve-out: three shapes, each with a decidable test, and one with a word count.

*Ruled 2026-09-15 by the tech lead directly. Not delegated.*

## R37 — A SQLModel-persisted enum's values are UPPER, even when it mirrors a vendor · 2026-09-15 · narrows R16

**Ruling: R16's vendor-casing carve-out holds only while the enum stays on the wire. The moment a SQLModel column persists it, its values are UPPER_SNAKE.**

**Why, and it is a library fact rather than a preference.** SQLAlchemy persists an enum's **member name**, not its value. A vendor-mirroring enum whose members are lowercase therefore writes `PRO` into a Postgres type created with the label `pro`, and every insert fails.

**The tech lead's own words:**

> *"I think in future, string enums that are being used by SQLModel should be in all caps; sidesteps this entire issue. Hacky, yes, but we work with whatever oddities that comes with the libraries we use."*

**This narrows a direct ruling, and satisfies R27.** R16 is direct. The contradicting evidence is the lead's own later words in review. The narrowing is scoped to one clause, vendor-mirroring enums that are *also persisted*, and R16's stated rationale is untouched everywhere else, because it was about raw payloads round-tripping without a case transform, which only applies to an enum being parsed from a payload.

The deciding factor is persistence, not provenance: a persisted enum mirroring a vendor reads `PRO = "PRO"`, while a non-persisted enum mirroring the same vendor stays lowercase.

*Ruled 2026-09-15 under explicit delegation. The quoted position is the tech lead's own, verbatim. Reversible by a higher-numbered ruling.*

## R38 — A rule with live counter-sites is accepted, not fixed piecemeal · 2026-09-15

**Ruling: when a rule has known counter-sites in the tree, the default is to accept them and leave them alone.** Consistency outranks correctness at the level of style. A defect that is uniform across the codebase stays uniform until a deliberate sweep changes it everywhere.

**The tech lead's own words**, 2026-09-15:

> *"The default is to accept it. The codebase is due for a style sweep, but consistency comes first. our STYLE.md is the platonic ideal, but we live in a world of matter, not forms."*

**It also decides what a review finding is worth.** A finding whose construct is codebase-wide is not a finding — it is an observation about the sweep that has not happened. The exemplar is a redundant ORM cascade the reviewer had measured at one SELECT plus one DELETE per feedback row where the FK does it in a single statement, with thirteen more instances repo-wide:

> *"This is wrong yes, but it is the codebase convention and has no side-effects. This should stay as it is"*

**Note what this settles, because it is the sharp edge:** uniformity won against a *measured* cost, not merely a theoretical one. The bar for overriding it is therefore not "the reviewer proved a cost" — it is a specific ruling, or a sweep.

**What it does not do.** It is not a licence for new code to join a divergence. Every ruling in this file governs what is written from its date forward, and divergences recorded under other rulings are *not precedent* for exactly that reason. R38 governs the existing sites, never the next one.

*Ruled 2026-09-15 by the tech lead directly. Not delegated.*

## R39 — The `error_message` column has no shape rule; more diagnostic information is better · 2026-09-15

**Ruling: `error_message` is a diagnostic field, not a user-facing message, and its contents are the writer's call.**

**The tech lead's own words**, 2026-09-15:

> *"There is no hard rule for this row. The purpose of this row is to record information that would be useful for error diagnosis, so more information is actually better. How it is implemented is left up to the writer"*

**This is a blank being filled, not a rule being narrowed.** `api/STYLE.md`'s *"An error message is its `ErrorCode` restated in prose"* governs the message an `AppHttpExceptionBase` carries to a user. The `error_message` **column** is a different thing that happens to share a word, and no rule has ever governed it. Three shapes are all licensed: the vendor's own prose (`str(exc)`), a `Type: message` string (`f"{type(unexpected_failure).__name__}: {unexpected_failure}"`), and the error category name alone.

The bare-category case was itself ruled in review: *"The ruling stands, so `error_message` keeps the category name"*. R39 does not disturb that choice; it says the choice was the writer's to make, and that the richer forms are equally fine.

**The corollary the same thread settled:** the log line is where the human sentence lives.

*Ruled 2026-09-15 by the tech lead directly. Not delegated.*

## R41 — The blind-catch rule governs a catch that *decides* something; a `noqa` reason licenses the rest · 2026-09-15

**Ruling, in three parts, all decided directly by the tech lead after debate.**

**(A) The rule narrows.** `except Exception` is banned **where the catch decides something** — where it maps to a domain exception, or degrades into a silent default. A blind catch that logs and re-raises, or that contains failure in work whose collapse must not reach the caller, is a different construct and is not a violation.

The rule's own stated harm is the test: *"a blind catch routes the bug it was not written for — a typo's `AttributeError`, a `KeyError` from a renamed field — into the branch built for a network failure, so the real fault surfaces as the wrong `ErrorCode`."* Where nothing is routed, nothing is harmed.

**(B) A `# noqa: BLE001` reason licenses; a reference does not.** An annotation stating a reason a reviewer can disagree with is licensed. An annotation pointing at the divergence record is not, because that record is the list of sites carrying the comment — writing it makes it true, which is a loophole with a citation rather than a decision.

```python
# Licensed
except Exception:  # noqa: BLE001 — the answer must survive any render fault

# Not licensed
except Exception:  # noqa: BLE001 — recorded divergence, STYLE-REFERENCE.md:721
```

**(C) A `noqa` reason is not a comment.** It is the reason argument of a machine-readable suppression, so R25 and R36 do not reach it and it is not a fourth licensed comment shape.

**This is what `BLE001` turns on against.** The rule is not lintable as narrowed, because `BLE001` cannot tell "re-raises" from "maps to a domain exception". So enablement means a `noqa` carrying a reason at each surviving site. Reviewing reasons is real work; reviewing references was theatre.

*Ruled 2026-09-15 by the tech lead directly, after debate. Not delegated.*

## R42 — A domain-verb CRUD name is right for a single-attribute write · 2026-09-15 · narrows R30 · compliance table corrected by **R47**

**Ruling: the test for a mutation method's name is how many attributes it writes and whether the name identifies them, not whether a value is hard-coded.** A domain-verb name is correct when the method writes **one** attribute that the name names. Once it writes several a reader cannot infer from the name, it becomes a general `update_` method taking those fields as parameters.

**The tech lead's own words**, 2026-09-15:

> *"`favourite`/`unfavourite` ×6, `accept_eula`, `mark_as_read`/`mark_as_unread` these are actually fine. The distinction is, these only changes one attribute in a row. But if it is something like `mark_as_failed` and changes a message status, writes an error code, and does many other things that are difficult to infer from the method name, that is where a general `update` method should be used"*

**This corrects R30, and the error was in the delegated ruling.** R30 generalised *"CRUD hard-codes no value that encodes a business rule"* from two sources: a fix where hard-coded **filters on a read** became parameters, and a rejection of `mark_ticket_in_use`/`mark_ticket_failed`. The first is about reads and is untouched. The second was read too broadly: what made `mark_ticket_failed` wrong was that it wrote status, error and timestamps behind a name that says none of them, not that it hard-coded a value. R30 was ruled under delegation and is reversible on that basis; this is that reversal, of the write half only.

**R30's read half stands unchanged.** A lookup names every filter it applies and takes the filter values as parameters. `get_all_stale_tickets_in_use_by_created_by_id` is still wrong, and `get_all_by_status_and_created_by_id` is still right, because a hard-coded filter is a different defect from a well-named write.

**Also unchanged from R30:** CRUD returns SQLModel objects or primitives and builds no composite of its own, and it returns nothing no caller consumes.

*Ruled 2026-09-15 by the tech lead directly, correcting a delegated ruling from the same day. Not delegated.*

## R45 — The caught exception is `error`, and takes the `noun_to_verb` affix when it is held to be passed on · 2026-09-17

**Ruling: the variable bound by `except ... as <name>` is `error`. Where the handler holds the exception in order to hand it to something else, it takes the existing `noun_to_verb` affix instead — `error_to_record`, `error_to_raise`. Where a `BaseException` catch-all sits beside a typed handler in the same `try`, the catch-all is `unexpected_failure`, so the two blocks do not read alike.**

The abbreviations `e` and `exc` are already banned by *Spell the domain object out in full*; this ruling does not add that ban, it names what replaces them. A parameter that merely reads the exception it was handed is plain `error` — the affix states why a value is held, and inside the recorder the holding is over.

**Canonical:**

```python
# held in order to record it
    except AppHttpExceptionBase as error_to_record:
        _record_search_failure(request, error_to_record, session)
        raise

# the recorder only reads it
def _record_search_failure(..., error: AppHttpExceptionBase, session: Session) -> None:

# typed handler beside its catch-all
    except SpeechSearchError as error:
        ...
    except BaseException as unexpected_failure:  # noqa: BLE001 — the failure must be recorded
```

**Two things this ruling does not reach.** FastAPI exception-handler parameters keep `exc`, because they mirror the framework's own handler signature and are not `except ... as` bindings at all. And a qualified name such as `validation_error` stands where it has no collision to resolve: it is taste rather than necessity.

**Why `error` and not `e`, which is what the ecosystem does.** Measured across CPython's stdlib, Django, Pydantic, Requests, FastAPI, Starlette and SQLAlchemy, `e` is the plurality in seven of nine samples, and Google's style guide is the only canonical source with a rule here — it bans single-character names and then carves `e` out by name. Nothing in PEP 8, PEP 20, the tutorial, the language reference, `ruff`, `pylint` or `flake8` governs the bound name. Adopting `e` was considered and declined: it would have required carving a hole in *Spell the domain object out in full* to admit the one abbreviation the guide most often has to argue against, and it would have collapsed the typed handler and its catch-all into the same name.

*Ruled 2026-09-17 by the tech lead.*

## R46 — CRUD owns the `updated_at` clock; no caller supplies a timestamp · 2026-09-17

**Ruling: every CRUD mutation method on a model that declares `updated_at` sets it itself, with `datetime.now(timezone.utc)`, as the first line of its prepare phase.** No caller passes a timestamp in, and no mutator leaves the column alone. A batch method (`update_all_*`) computes one timestamp before its loop and writes that same value to every row, so a batch stays internally consistent.

**What this settles.** R42 measured the naming rule "ignoring `updated_at` housekeeping" and left the housekeeping itself unruled. The source tree held three incompatible shapes at once: a mutator calling the clock internally, a mutator taking `updated_at: datetime` as a parameter, and a mutator that never touched the column.

**The tech lead ruled for the clock living in CRUD, against the recommendation put to him**, 2026-09-17, choosing option (b) from three offered: (a) the caller always supplies `updated_at`, (b) CRUD always sets it internally, (c) leave it alone and file a ticket. The counter-argument was that a clock inside CRUD is a hidden dependency of the same class as a lookup inside CRUD. The ruling is (b), and it is the smaller and more uniform of the two fixes: one rule a reviewer can check by reading a single method, rather than a convention spread across every call site.

**Two consequences, both accepted deliberately:**

1. **A favouriting-style write moves a row in any ordering that sorts on `updated_at`.** Favouriting is a modification, so the bump is correct, but it is a user-visible change and not a pure refactor.
2. **`update_updated_at` survives as a method that takes only the row.** It is not redundant: a service still needs a way to move a parent's ordering position without writing a business field.

**Models without the column are untouched.**

**A suppression flag was considered and refused.** Nothing read `updated_at` in a way a mutation would corrupt. **When a suppression need does arrive, the answer is never a flag on the mutator.** It is a new column (build it when a reader appears, and not before), or a bulk SQL `UPDATE` that bypasses the CRUD method. A defensive `update_updated_at: bool = True` flag guarded nothing and was deleted.

*Ruled 2026-09-17 by the tech lead directly, choosing against the stated recommendation. Not delegated.*

## R47 — `crud/` is a Table Data Gateway; a name is a claim, and a recurring field group is a record · 2026-09-17 · corrects R42's compliance table

**Ruling, in five clauses.** They are one decision. Splitting them across rulings is how a rule ends up stated in one document and missing from another.

1. **`crud/` is Fowler's Table Data Gateway**, named as such. One class per table, the session handed in, called only by `services/`. This settles which literature governs the layer: Fowler's gateways, not Evans' Repository. The two prescribe opposite answers on method vocabulary, and citing both is how the argument kept restarting.

2. **A method's name is a claim about the row after the call returns.** If any legal combination of arguments makes that claim false, or if the method writes anything the name does not state and no parameter supplies, the name asserts a rule the method does not enforce. `updated_at` is excepted under R46, and a domain-verb method may hard-code only the single attribute its own name states, per R42. Decidable from the signature and the assignments, with no other file open.

3. **A wide write gets a typed record only when the same field group already appears in two or more *independent* signatures on the same model.** A singular method and its `update_all_*` bulk twin are one write at two arities, not two signatures, and do not qualify: the bulk method already takes one value set for many rows, so a record adds nothing. Otherwise the method takes exactly the fields this write sets, with no optional parameters. The record is declared in the module that defines the row it describes, under the Common Closure Principle: it changes exactly when the columns change. `crud/` already imports that module for the model class, so no dependency edge appears; dependency is counted at module granularity, not symbol granularity.

4. **Do not call the record a value object or a DTO.** "Value object" imports Evans' obligations (immutability, domain meaning, membership in the ubiquitous language). "DTO" imports Fowler's *LocalDTO* warning that they belong on remote boundaries, where he quotes Randy Stafford calling the local cost "significant, and it's painful, perhaps second only to the cost and pain of object-relational mapping". An unloaded word inherits neither.

5. **The `update_*` family is redundant in principle, and is kept deliberately.** SQLAlchemy documents its `Session` as a Unit of Work with attribute-level change tracking, so attribute assignment plus commit would suffice, and Evans' Repository has add, remove and select with no update at all. The team keeps explicit methods for the typed signature, which is the only check on these writes since SQLModel attribute assignment is unchecked at runtime, and because a generic `update` is an unfiltered binding function (OWASP API6:2019, mass assignment). Recorded as a standing divergence so this is not relitigated.

**What clause 2 replaces.** R30's naming clause, *"named for the columns it touches, not for the concept the service is expressing"*, is retired. It cannot be sourced to Fowler, whose constraint on gateways is about logic rather than vocabulary, and Evans argues the opposite outright in Intention-Revealing Interfaces: name operations *"without reference to the means by which they do what they promise"*. A method named for its columns is named by its means. **R30's other halves stand**: a lookup names every filter it applies and takes filter values as parameters, CRUD returns SQLModel objects or primitives and builds no composite of its own, and it returns nothing no caller consumes. Note that clause 3 has `crud/` *accept* a record as a parameter, which is the opposite direction from the composite-returning defect R30 rejected.

**Corrections to R42's measured table.** A name such as `update_completion` is not compliant merely because it carries an `update_` prefix; R42's stated test is whether the name identifies the attributes, and its stated remedy is taking those fields as parameters. A method that writes exactly one attribute behind a verb that names none of it fails R42's own "one attribute that the name names".

**The delete-one test is not the entry condition, and quoting it alone is the common error.** Fowler and Beck's data-clump rule opens with the group appearing *"in lots of places: as fields in a couple of classes, as parameters in many method signatures"*; "consider deleting one of the data values" is the confirmation applied to a group that already recurs. Applied to a single wide write it is a guaranteed false positive, because the columns of one row always co-occur, and used alone it hands a record to every wide write in the layer. Count the signatures with a script, not by reading: the eye skips a `create_`/`update_` pair as one method written twice, which is exactly the shape clause 3 exists to catch.

**One benefit Fowler promises is unavailable here, and the ruling does not claim it.** He justifies Introduce Parameter Object by what follows, *"the real power of this refactoring is how it enables deeper changes"*, meaning behaviour migrating into the new type. Clause 1 forbids business logic in this layer, so behaviour can never move in. What remains is the smaller half he lists first: an explicit relationship between the items, and consistent naming across call sites.

*Ruled 2026-09-17 by the tech lead directly, after four research passes over Fowler, Evans, Ousterhout, Parnas, Page-Jones, Percival and Gregory, and the FastAPI and SQLModel reference implementations. Nothing in this area is empirically established; every authority cited is an argument, not a measurement.*

---

# Open — awaiting a ruling

**Nothing in this section is a rule.** Each entry states the question and what would settle it. **Reviewers: this section exists so you do not relitigate what is documented-undecided.** If a PR discussion lands on one of these, the answer is "that is open — here is the entry", not a fresh argument.

When a question is answered it becomes the next `R{N}` above and is struck from this list.

## Q1 — what surface does a *new* endpoint's external-dependency failure use? (left open by R4)

R4 settled the invariant and the per-subsystem rule. It deliberately left a gap: a brand-new endpoint has no subsystem precedent, so it has **no stated default**, and the guide states that gap rather than inventing one.

- **Question:** when a new subsystem's first external call fails, which surface does it take by default — `502`, or `200` + `status` — and who decides, the author or the reviewer?
- **What would settle it:** a ruling. The guide currently records the alternative answer — that it is a per-PR review decision — so if that *is* the intended answer, nothing more is owed.
- **Adjacent, undecided:** should the chosen surface be recorded somewhere durable (an ADR, a comment on the router) so the next endpoint in that subsystem inherits a precedent?

## Q12 — R13 names `__init__` only; the other special methods, and `ANN204`, are still open

**Left open by R13 itself.** R13's text names `__init__`. Other dunder methods have return types fixed by convention — `__str__`/`__repr__` (`str`), `__enter__`, `__exit__`, `__eq__` (`bool`). **Nothing in R13 says whether these get the same carve-out or fall back to the ordinary annotate-everything rule.**

This is not academic: `ANN204` is the one ruff check covering the whole class, `__init__` included — **it has no separate code for `__init__` alone.** R13 forbids enabling it outright. **That leaves the other special methods with no enforcement mechanism** unless `ANN204` is enabled and carved back out per-method or per-file — and the shape of that carve-out depends on the answer.

- **Question:** for special methods other than `__init__`, does the annotate-everything rule apply in full, or does the `__init__` carve-out generalize to all dunders?
- **What was checked, so this is not asked blind:** a sweep of the source codebase for `def __str__`, `__repr__`, `__enter__`, `__exit__`, `__aenter__`, `__aexit__` found **zero** definitions. There is no live counter-example on either side — a ruling here establishes precedent rather than reconciling one.
- **What would settle it:** one sentence. Until then **`ANN204` cannot be enabled even with an exclusion**, because the exclusion's shape is exactly what is undecided.

## Q13 — "no guard for a state the types make unreachable" was dropped for want of a live path

The rule is real and so is its fix: a `service_type not in [...]` guard was deleted because the parameter was already typed as the enum, so the guard tested a state the signature forbids. Both the fix and the only exemplar lived in a file that no longer exists, so rather than ship a rule anchored entirely to a deleted path, it is omitted.

- **Question:** do you want it? It is a good rule and nothing contradicts it.
- **What would settle it:** one live `file:line` where a guard tests a state the annotation already forbids, or one where such a guard was correctly *not* written.

## Q16 — validation is inline or imported from `validators/`, never an ad-hoc local helper

A service defined a local helper function to run a validation check. The author's instruction: *"Do not do validation as helper functions. They should either be validated inline, or we should import a validator function and use it."*

- **Question:** does this ban *any* service-local helper whose job is validation, regardless of size or reuse — which would tighten the single-use-helper conjunction (R10) specifically for validation logic?
- **What would settle it:** another PR re-asserting it, or one sentence from the author.

## Q20 — a service never constructs its own `Session`

A service opened `with Session(engine)` inside a worker thread. Two instructions, both on the same ticket: *"We do not call a raw `Session(engine)` anywhere except in the database init function"*, and a request that the database init module provision a helper so services never need to. A later instruction narrows it further: *"for all functions that uses `open_session`, can we please use the session provided by the router?"*

One counter-site is genuine: a middleware running outside any request's dependency graph has no router session to inherit.

- **Question:** is this a rule, and does the middleware's position make it a carve-out or a violation? The narrowed form is stronger still, since it would ban the `open_session` helper at the same time as asking for it.
- **Why it is not ruled:** three threads, but one ticket. Every other ruling in the same sweep cleared three or more distinct tickets.
- **What would settle it:** a PR on another ticket re-asserting it, or one sentence from the author.

## Q21 — a set built from constants, just to test membership

A gateway module built a set of constants to test membership against. The author's instruction: *"please don't do this. don't create sets with constants. Just use the constants directly."*

This is the shipped *"Repeat the comparison in full rather than using `in` / `not in`"* preference, applied to a set literal, and R34 deliberately does not cover it — R34 governs mappings, and a set is not one.

- **Question:** does this rise from a **Preference** to a rule, and does it reach a set of characters as well as a set of enum members?
- **Why it is not ruled:** one PR.
- **What would settle it:** another PR re-asserting it, or one sentence from the author.

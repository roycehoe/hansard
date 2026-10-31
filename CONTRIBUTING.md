# Contributing

Open an issue before you write code. A pull request that nobody discussed first may not be reviewed.

## Reporting an error in the record

A wrong credit, missing text or wrong date is not a code change. Use the "Report an error" link beside a speech, or the [Report an error form](https://github.com/roycehoe/hansard/issues/new?template=report-an-error.yml). [docs/corrections.md](docs/corrections.md) says what happens next.

## Proposing a change

1. Open an issue that says what you want to change and why. For a bug, give the page address and what you saw.
2. Wait for Royce Hoe to reply. He decides whether the change fits the site.
3. Fork the repository, make the change, and open a pull request that links the issue.

Keep each pull request to one change. Subjects follow Conventional Commits, such as `fix: sort search results by date`, under 72 characters.

## Checks

CI runs these on every pull request, so run them first.

From `app/`:

```bash
pnpm lint
pnpm exec prettier --check .
pnpm contrast
pnpm test
pnpm build
pnpm size
```

From `api/`:

```bash
uv run ruff check .
uv run ruff format --check .
uv run basedpyright
uv run pytest -m "not database"
```

Conventions are in [app/CLAUDE.md](app/CLAUDE.md), [app/STYLE.md](app/STYLE.md), [api/CLAUDE.md](api/CLAUDE.md) and [api/STYLE.md](api/STYLE.md). A string the reader sees follows the Copy section of `app/STYLE.md`. The site shows a value as the record prints it ([ADR 0006](docs/adr/0006-display-what-the-record-prints.md)).

## Changes to stored data

This site only reads the database ([ADR 0001](docs/adr/0001-read-only-api.md)), so it cannot change a stored row. A fix that needs different rows, such as a wrong credit or two party spellings merged, belongs in [roycehoe/hansard-scraper](https://github.com/roycehoe/hansard-scraper). Stored rows change there only through a supervised write, which its [CONTRIBUTING.md](https://github.com/roycehoe/hansard-scraper/blob/master/CONTRIBUTING.md) describes. If the site cleans data on its way out of the database, the change also adds a row to the scraper's `docs/data-loss-register.md`.

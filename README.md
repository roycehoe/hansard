# Hansard

A website for reading Singapore's parliamentary record by sitting, by Report and by person. It is not an official Parliament site. The Official Report on [SPRS](https://sprs.parl.gov.sg/search/) is the authoritative record, and each Report page links to its copy there.

The site only reads. Its data comes from the Postgres database that [roycehoe/hansard-scraper](https://github.com/roycehoe/hansard-scraper) builds from SPRS, and the API connects through a role that can only `SELECT`.

## Status

Private beta. The site is behind a password and open to a small test group.

The archive covers 22 April 1955 to 7 October 2026, including the 15th Parliament. How often the site credits a speech to the wrong person, and what else is missing, is on the site's "Data quality and methods" page at `/coverage/methods`. The attribution figures, their method and the known limits of the data are in the [hansard-scraper README](https://github.com/roycehoe/hansard-scraper#how-well-speeches-are-attributed).

## How it was built

AI coding tools wrote most of the code. Royce Hoe planned the work and answers for it. [docs/how-this-was-built.md](docs/how-this-was-built.md) gives the commit history and the audits that checked the output, including one that says the project is not done.

## Report an error

Email hansard@fancybinary.sg, or use the "Report an error" link beside any speech. To report in public, use the [Report an error form](https://github.com/roycehoe/hansard/issues/new?template=report-an-error.yml). Each fix is logged in [docs/corrections.md](docs/corrections.md).

## Run it locally

You need Node 24 with pnpm, Python 3.15 with uv, and a copy of the scraper's database. The hansard-scraper README explains how to build one.

```bash
# API, from api/
uv sync
DATABASE_URL=postgresql://... uv run fastapi dev   # http://localhost:8000

# Frontend, from app/
pnpm install
pnpm dev                                           # http://localhost:5173
```

The deployed site is one container that serves the frontend at `/` and the API at `/api`, behind basic auth.

```bash
docker build -t hansard-web .
docker run -p 8080:8080 -e DATABASE_URL=... -e BASIC_AUTH_USERNAME=... -e BASIC_AUTH_PASSWORD=... hansard-web
```

Conventions for each part are in `app/CLAUDE.md` and `api/CLAUDE.md`.

## Licence

The code is under the [MIT licence](LICENSE). The licence covers the code in this repository, not the text of the Official Reports, which belongs to the Parliament of Singapore.

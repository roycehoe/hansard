<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/banner-dark.svg">
  <img alt="Open Hansard" src="docs/images/banner-light.svg">
</picture>

Open Hansard is a website for Singapore's parliamentary record since 1955. It splits every report into speeches, links each speech to the member who gave it, and puts each member's speeches and attendance on one page.

[Open the site](https://openhansard.sg) · [Coverage](https://openhansard.sg/coverage) · [Data quality and methods](https://openhansard.sg/coverage/methods)

## Why I built it

I wanted one place where you could go from a member to their speeches to their attendance. People get involved in politics when the record is easy to look through, and Singapore's isn't. All of it is public on [SPRS](https://sprs.parl.gov.sg/search/), Parliament's search system, but nobody has indexed it by member:

- **Speakers are printed names.** No speech on SPRS links to the member who gave it, so you can't list everything one member said.
- **The scanned text is full of typos.** Names and constituencies are misspelt, such as "Gob Keng Swee" for Goh Keng Swee and "Sembawano" for Sembawang.
- **Each report is one block of HTML.** SPRS shows a report as one page, and its API returns one HTML text that holds the whole report.
- **Attendance has no index.** It is listed inside each sitting. No page shows how often one member turned up.
- **The design is antiquated.** The member filter in SPRS search matches printed names only. Pair Search, from OGP, makes reports easier to find. Open Hansard splits them into speeches and links each one to the member who said it.

## Who it's for

Citizens first: to see what their MP said and whether they turned up, to look up older politicians, and to read how controversial bills were debated. The site is also careful enough for researchers and journalists to quote, with a citation and a link to the report on SPRS beside every speech.

## What it does

- [Find your MP](https://openhansard.sg/people?constituency=Ang%20Mo%20Kio&parliament=15). Pick a constituency on /people to list who sat for it in the latest Parliament.
- [A person's page](https://openhansard.sg/people/399-louis-ng-kok-kwang) lists their memberships, their paragraphs and attendance in each Parliament, and every report they spoke in.
- [A report](https://openhansard.sg/reports/written-answer-16079) shows the text as speeches, each linked to the person who gave it when the speaker label is enough to tell who spoke. A misspelt name links to the right member, and the text keeps the record's spelling.
- [A speech link](https://openhansard.sg/reports/written-answer-16079?s=1&q=asked+the+minister+for+manpower+a+apart+from) opens one speech. Each speech has Copy link, Cite and Report an error beside it.
- [A sitting](https://openhansard.sg/sittings/2024-03-06) lists its reports, then who was present and who was absent.
- [Search](https://openhansard.sg/search?q=heat%20stress) covers speeches and report titles, with filters for Parliament, dates, report type, person and constituency.

## Status

- The site is live and has been public since 20 October 2026.
- It is not an official Parliament site. The Official Report on [SPRS](https://sprs.parl.gov.sg/search/) is the authoritative record, and each report page links to its copy there.
- The data comes from [roycehoe/hansard-scraper](https://github.com/roycehoe/hansard-scraper). This site only reads it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/report-dark.png">
  <img alt="A report page: a written answer from 6 March 2024, split into speeches, with each speaker's name linked to their page" src="docs/images/report-light.png">
</picture>

## Report an error

Email royceinbox@hotmail.com, or use the "Report an error" link beside any speech, which opens an email with that speech's link filled in. To report in public, use the [Report an error form](https://github.com/roycehoe/hansard/issues/new?template=report-an-error.yml).

## Who runs it

One person, Royce Hoe, runs the site. He fixes an error the archive introduced, in the text or in who it credits, and takes a report off the site within 2 working days if Parliament asks ([docs/corrections.md](docs/corrections.md)).

If Royce stops working on the site, it keeps running on its own. A daily job adds new sittings until the hosting is no longer paid for or Parliament's website changes. No one else holds access to the hosting or the database. The code for the site and the scraper stays public on GitHub under the MIT licence, so anyone can rebuild the database from Parliament's website.

## How it was built

[docs/how-this-was-built.md](docs/how-this-was-built.md) describes how the code was written and the audits that checked it.

## User testing

[docs/user-testing.md](docs/user-testing.md) records the usability sessions: the date, how many people took part, the tasks, where each got stuck and what changed.

# Technical documentation

## Run it locally

To run it you need Node 24 with pnpm, Python 3.15 with uv, and a copy of the scraper's database. The [hansard-scraper README](https://github.com/roycehoe/hansard-scraper#setup) explains how to build one.

```bash
# API, from api/
uv sync
DATABASE_URL=postgresql://... uv run fastapi dev   # http://localhost:8000

# Frontend, from app/
pnpm install
pnpm dev                                           # http://localhost:5173
```

The deployed site is one container that serves the frontend at `/` and the API at `/api`. When the app and API checks pass on `master`, CI deploys it to DigitalOcean App Platform, which builds the [Dockerfile](Dockerfile) as [.do/app.yaml](.do/app.yaml) specifies.

```bash
docker build -t hansard-web .
docker run -p 8080:8080 -e DATABASE_URL=... -e BASIC_AUTH_USERNAME=... -e BASIC_AUTH_PASSWORD=... hansard-web
```

Conventions for each part are in [app/CLAUDE.md](app/CLAUDE.md) and [api/CLAUDE.md](api/CLAUDE.md).

## Contributing

Open an issue before you open a pull request. [CONTRIBUTING.md](CONTRIBUTING.md) says how.

## Licence

The code is under the [MIT licence](LICENSE).

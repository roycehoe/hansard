<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/banner-dark.svg">
  <img alt="Open Hansard" src="docs/images/banner-light.svg">
</picture>

Open Hansard is a website I've built for exploring Singapore's parliamentary record, going back to 1955. I wanted a way to follow an MP's contributions over time, with their speeches, parliamentary memberships and attendance in one place.

[Open the site](https://openhansard.sg) · [Coverage](https://openhansard.sg/coverage) · [Data quality and methods](https://openhansard.sg/coverage/methods)

## Why I built it

The question that interested me was how MPs' positions develop over time. Answering it means connecting what someone said in one debate with their contributions years later, even as their constituency or the way their name is printed changes. Parliament's [SPRS](https://sprs.parl.gov.sg/search/) publishes the reports, but those connections take work to put together:

- **Speakers appear as printed names.** A name above a speech does not link to a person's record. Searching for that name still leaves you to work out which contributions belong to the same person.
- **Spelling gets in the way.** Digitised records include names such as "Gob Keng Swee" and constituencies such as "Sembawano". An index needs to account for these spellings without silently rewriting the transcript.
- **Reports arrive as whole documents.** SPRS presents each report as a page, and its API returns the report in one block of HTML. Following a speaker means first separating their contribution from the surrounding debate.
- **Attendance stays inside each sitting.** To follow a member's attendance, you have to bring those individual lists together too.
- **Finding a report is only part of the task.** The SPRS member filter works with printed names. Pair Search, from OGP, makes reports easier to find. My interest is in the next step: moving between a report, the people speaking in it and their other contributions.

I've spent the past three years building that index, with the hope that making the record easier to explore will help more people take an interest in our politics and examine it for themselves.

The older debates are surprisingly fun to read, too. One of my favourite finds is [Tan Cheng Tong's 1963 exchange](https://openhansard.sg/reports/00069110-ZZ.00051736-ZZ_1%23id004_19631212_S0002_T00081-budget?s=21&q=mr+speaker+the+members+of+the+government+are), where the original insult seems to survive only through the outrage it provoked.

## Who it's for

I had a few uses in mind: looking up what your MP has said, following politicians from earlier generations, or reading how a controversial bill was debated. Researchers and journalists can trace a position over time and follow citations back to the original report on SPRS. For developers interested in working with the records, this repository and the scraper show how I've put the archive together.

## What it does

You can start with a person, a sitting or a subject and follow the links between them:

- [Find your MP](https://openhansard.sg/people?constituency=Ang%20Mo%20Kio&parliament=15) by choosing a constituency on the people page, starting with the latest Parliament.
- [A person's page](https://openhansard.sg/people/399-louis-ng-kok-kwang) brings their memberships, attendance and contributions together by Parliament, with links to the reports they contributed to.
- [A report](https://openhansard.sg/reports/written-answer-16079) groups the text into speeches, with links to speakers where they've been identified. The transcript keeps its original spelling, even when a misspelt speaker label links to the right person.
- [A speech link](https://openhansard.sg/reports/written-answer-16079?s=1&q=asked+the+minister+for+manpower+a+apart+from) takes you straight to a contribution. Copy link, Cite and Report an error sit on each paragraph so you can share it, quote it or flag a problem where you found it.
- [A sitting](https://openhansard.sg/sittings/2024-03-06) puts the day's reports beside its lists of members present and absent.
- [Search](https://openhansard.sg/search?q=heat%20stress) lets you follow a subject through speeches and report titles, then narrow it by Parliament, date, report type, person or constituency.

## Status

I opened the site to the public on 20 October 2026. It is an unofficial project, and the Official Report on [SPRS](https://sprs.parl.gov.sg/search/) remains the authoritative record. Each report links back there so readers can check my work against the source.

The records come from my separate [hansard-scraper](https://github.com/roycehoe/hansard-scraper) project. The [coverage page](https://openhansard.sg/coverage) tracks what's available, while the [methods](https://openhansard.sg/coverage/methods) explain how I build the connections and where gaps remain.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/report-dark.png">
  <img alt="A report page: a written answer from 6 March 2024, split into speeches, with each speaker's name linked to their page" src="docs/images/report-light.png">
</picture>

## Report an error

If you find something wrong, email me at royceinbox@hotmail.com. The "Report an error" action on each paragraph fills in its speech's address for you, which helps me find the passage you mean. If you prefer to report it publicly, use the [Report an error form](https://github.com/roycehoe/hansard/issues/new?template=report-an-error.yml).

## Who runs it

I'm Royce Hoe, and I build and maintain the site on my own. When the archive introduces an error in the text or credits the wrong speaker, I fix it and record the change in the [corrections log](docs/corrections.md). If Parliament asks me to take down a report, I do so within 2 working days, without asking for a reason.

The scraper is scheduled to check for new records daily, although keeping it running still means paying for hosting and updating it when Parliament's website changes. I'm currently the only person with access to the hosting and database accounts, which leaves the project dependent on me for that upkeep. I've made both projects public under the MIT licence so that someone else could rebuild the database from Parliament's website and run their own copy if I stop maintaining this one.

## How it was built

I built the website with React and TypeScript, backed by a Python API using FastAPI. PostgreSQL holds the records prepared by the scraper, including the connections between people and their contributions. Keeping the API read-only lets me develop the website without giving it the ability to alter the archive; changes to the data go through the scraper project.

I used AI coding tools for most of the implementation and documented the process, my decisions and the audits in [How this was built](docs/how-this-was-built.md). The [documentation index](docs/README.md) brings together the design decisions, data notes and guides for anyone who wants to look further.

## User testing

I want to see where the site makes sense to someone else and where it gets in their way. The [user-testing protocol](docs/user-testing.md) sets out five tasks, from finding and sharing a speech to checking a citation and reporting an error. No sessions have run yet; that page is where I'll record what people get stuck on and what I change as a result.

## Technical documentation

### Run it locally

To work on the site, you'll need Node 24 with pnpm, Python 3.15 with uv, and a copy of the scraper's database. Start with the [hansard-scraper setup guide](https://github.com/roycehoe/hansard-scraper#setup) to build the database, then use a [read-only account](docs/api-database-role.md) for the API.

In one terminal, start from this repository's root and run the API. Replace the example connection details with those for your database; the URL format matches [api/.env.example](api/.env.example).

```bash
cd api
uv sync
DATABASE_URL='postgresql+psycopg://hansard_ro:password@localhost:5432/postgres' uv run fastapi dev
# http://localhost:8000
```

In a second terminal, also starting from the repository root, run the frontend:

```bash
cd app
pnpm install
pnpm dev
# http://localhost:5173
```

For deployment, I package the frontend and API in one container, serving them at `/` and `/api`. A push to `master` deploys to DigitalOcean App Platform after the frontend, API and database schema compatibility checks pass. The [Dockerfile](Dockerfile) defines the build and [.do/app.yaml](.do/app.yaml) configures the deployment.

You can try that container from the repository root with the following placeholders replaced. This example uses password protection; the production site sets `PUBLIC_MODE=true` to allow public access.

```bash
docker build -t hansard-web .
docker run -p 8080:8080 \
  -e DATABASE_URL='postgresql+psycopg://hansard_ro:password@database-host:5432/postgres' \
  -e BASIC_AUTH_USERNAME='example-user' \
  -e BASIC_AUTH_PASSWORD='replace-with-your-password' \
  hansard-web
```

When you start changing the code, [app/CLAUDE.md](app/CLAUDE.md) and [api/CLAUDE.md](api/CLAUDE.md) explain the conventions I use in each part.

### Contributing

Please open an issue before a pull request so we can discuss the change first. I've put the contribution instructions in [CONTRIBUTING.md](CONTRIBUTING.md).

### Licence

I've released the code under the [MIT licence](LICENSE).

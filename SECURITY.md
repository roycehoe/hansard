# Security policy

## Report a vulnerability

Email royceinbox@hotmail.com with "Security" in the subject. Do not open a public issue for a vulnerability.

Say which page, address or file is affected, the steps to reproduce it, and what an attacker could do with it.

Royce Hoe runs the site and reads each report himself.

## Scope

In scope:

- openhansard.sg and its API under /api, and hansard.fancybinary.sg, which redirects to it.
- The code in this repository and the workflow that deploys it.

Out of scope:

- A wrong credit or missing text in a report. That is a data error, not a vulnerability. See [docs/corrections.md](docs/corrections.md).
- Parliament's sites, including SPRS, and the services the site runs on: DigitalOcean, Cloudflare and GoatCounter. Report those to their operators.
- The scraper that builds the database. It has its own policy in [roycehoe/hansard-scraper](https://github.com/roycehoe/hansard-scraper/blob/master/SECURITY.md).

## What the site exposes

[docs/security.md](docs/security.md) lists the attack surface, the control on each part and what was left out.

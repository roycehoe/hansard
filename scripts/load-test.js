// Load test for the hansard site (launch task 24).
//
// Run it against a COPY of the site (a staging container with a cloned
// database), never production. A search burst can slow the real database.
//
// Command (fish or bash; k6 must be installed; run from the repo root):
//
//   k6 run -e BASE_URL=https://your-staging-copy.example -e BASIC_AUTH_USERNAME=user -e BASIC_AUTH_PASSWORD=pass scripts/load-test.js
//
// Shape: 20 virtual users for 5 minutes.
// Mix per iteration: 60% report and permalink pages, 10% browse pages
// (home, coverage, sittings), 20% search, 10% people pages.
// Every page view also asks for GET /api/refresh, because the footer on
// every page does.
//
// Pass: p95 under 3 s for everything except search, zero 5xx, and search
// that either answers or refuses fast. Also watch the database connection
// count in the DigitalOcean dashboard during the run. k6 cannot see it.

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import encoding from 'k6/encoding'
import { Rate } from 'k6/metrics'

const BASE_URL = (__ENV.BASE_URL || '').replace(/\/$/, '')
const USER = __ENV.BASIC_AUTH_USERNAME
const PASS = __ENV.BASIC_AUTH_PASSWORD

if (!BASE_URL || !USER || !PASS) {
  throw new Error('Set BASE_URL, BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD with -e.')
}

const serverErrors = new Rate('server_errors')

export const options = {
  scenarios: {
    mixed: { executor: 'constant-vus', vus: 20, duration: '5m' },
  },
  thresholds: {
    // Everything except search: p95 under 3 s.
    'http_req_duration{kind:page}': ['p(95)<3000'],
    'http_req_duration{kind:api}': ['p(95)<3000'],
    // Search has its own, looser limit. On the 1 GiB database a relevance
    // search took up to 6.3 s and oldest-first up to 18.7 s (launch-q1,
    // section 6). The build caps visitor searches at a 10 s statement
    // timeout and refuses a fourth concurrent search at once, so a real
    // answer should land under 10 s. 12 s leaves 2 s for queueing. If this
    // fails, search is the weak point. Do not tighten it to 3 s: that would
    // fail on a healthy site.
    'http_req_duration{kind:search}': ['p(95)<12000'],
    // Zero 5xx on every request, search included. 429 is the busy answer
    // (Search is busy, code search.busy): it is a 4xx, so it is expected
    // and does not count here. A 503 search.timed_out is a 5xx and counts
    // as a failure by design: a search that passes the 10 s timeout means
    // the indexes or the load are wrong, and the run should say so.
    server_errors: ['rate==0'],
    checks: ['rate>0.99'],
  },
}

const AUTH = { Authorization: `Basic ${encoding.b64encode(`${USER}:${PASS}`)}` }

// 429 (busy) and 410 (taken down) are valid answers, not failures.
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 410, 429))

function get(path, kind, name) {
  const res = http.get(`${BASE_URL}${path}`, {
    headers: AUTH,
    tags: { kind, name: name || path },
  })
  serverErrors.add(res.status >= 500)
  return res
}

// A page view loads the page and, because the footer is on every page,
// the refresh figures it shows.
function getPage(path, name) {
  const res = get(path, 'page', name)
  get('/api/refresh', 'api', '/api/refresh')
  return res
}

// 40 common words and phrases people search, plus rare words that suit
// oldest-first. Unique strings are generated at run time (see uniqueQuery).
const COMMON_QUERIES = [
  'housing', 'CPF', 'healthcare', 'transport', 'education', 'budget', 'GST',
  'minimum wage', 'public housing', 'MediShield', 'foreign workers',
  'climate change', 'COE', 'bus fares', 'hawker centres', 'national service',
  'retirement age', 'childcare', 'cost of living', 'water', 'mental health',
  'elderly', 'digital', 'cybersecurity', 'SkillsFuture', 'Medisave',
  'MRT breakdown', 'population', 'inflation', 'tax relief', 'ComCare',
  'community', 'small businesses', 'jobs', 'electricity', 'carbon tax',
  'pre-school', 'scams', 'drones', 'telehealth',
]
const RARE_QUERIES = ['rickshaw', 'tin mining', 'telex', 'floppy disk', 'abacus']
const SYLLABLES = ['ka', 'ro', 'mi', 'ta', 'ven', 'sul', 'dor', 'pen', 'lia', 'zor']

function uniqueQuery() {
  let word = ''
  for (let i = 0; i < 3; i++) word += SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  return `${word}${Math.floor(Math.random() * 1000)}`
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// Setup finds real report slugs, sitting dates, people and speech anchors
// from the API, so the test needs no fixture file.
export function setup() {
  const json = (path) => {
    const res = http.get(`${BASE_URL}${path}`, { headers: AUTH })
    if (res.status !== 200) throw new Error(`setup: ${path} returned ${res.status}`)
    return res.json()
  }
  const parliaments = json('/api/parliaments').parliaments
  const numbers = parliaments.map((p) => p.parliament_number).sort((a, b) => b - a)
  // Newest two Parliaments plus one older one.
  const chosen = [numbers[0], numbers[1], numbers[numbers.length - 1]].filter((n) => n !== undefined)

  const sittingDates = []
  const reportSlugs = []
  const people = []
  for (const number of chosen) {
    const sittings = json(`/api/sittings?parliament_number=${number}`).sittings
    for (const sitting of sittings.slice(0, 5)) {
      sittingDates.push(sitting.sitting_date)
      const detail = json(`/api/sittings/${sitting.sitting_date}`)
      for (const r of detail.reports.filter((r) => r.is_text_available).slice(0, 6)) {
        reportSlugs.push(r.report_slug)
      }
      for (const a of detail.attendance.filter((a) => a.person_id).slice(0, 4)) {
        people.push({ id: a.person_id, slug: a.person_slug })
      }
    }
  }
  if (reportSlugs.length === 0 || people.length === 0) {
    throw new Error('setup: found no reports or people. Is this the right database?')
  }

  // Checked permalinks: a few reports' real speeches, as the app builds
  // them (?s={ordinal}&q={anchor}). A report that does not answer 200 (for
  // example one taken down) is skipped.
  const permalinks = []
  for (const slug of reportSlugs.slice(0, 8)) {
    const res = http.get(`${BASE_URL}/api/reports/${slug}`, { headers: AUTH })
    if (res.status !== 200) continue
    const speeches = res.json().speeches.filter((s) => s.anchor !== '').slice(0, 2)
    for (const s of speeches) {
      permalinks.push({ slug, query: `?s=${s.ordinal}&q=${encodeURIComponent(s.anchor)}` })
    }
  }

  return { parliamentNumbers: numbers, sittingDates, reportSlugs, people, permalinks }
}

function viewReport(data) {
  // Half of the views are checked speech permalinks, when setup found any.
  const isPermalink = data.permalinks.length > 0 && Math.random() < 0.5
  const link = isPermalink ? pick(data.permalinks) : null
  const slug = link ? link.slug : pick(data.reportSlugs)
  getPage(`/reports/${slug}${link ? link.query : ''}`, '/reports/{slug}')
  const res = get(`/api/reports/${slug}`, 'api', '/api/reports/{slug}')
  check(res, { 'report ok': (r) => r.status === 200 })
}

function browse(data) {
  const roll = Math.random()
  if (roll < 0.3) {
    getPage('/')
    get('/api/parliaments', 'api')
  } else if (roll < 0.5) {
    getPage('/coverage')
    get('/api/coverage', 'api')
  } else if (roll < 0.6) {
    getPage('/coverage/methods')
  } else if (roll < 0.8) {
    const n = pick(data.parliamentNumbers)
    getPage('/sittings')
    get(`/api/sittings?parliament_number=${n}`, 'api', '/api/sittings')
  } else {
    const date = pick(data.sittingDates)
    getPage(`/sittings/${date}`, '/sittings/{date}')
    get(`/api/sittings/${date}`, 'api', '/api/sittings/{date}')
  }
}

function viewPerson(data) {
  if (Math.random() < 0.3) {
    getPage('/people')
    get('/api/people', 'api')
    return
  }
  const person = pick(data.people)
  getPage(`/people/${person.slug}`, '/people/{slug}')
  get(`/api/people/${person.id}`, 'api', '/api/people/{id}')
  get(`/api/people/${person.id}/reports?page=1`, 'api', '/api/people/{id}/reports')
}

function search() {
  // 50% common words, 30% unique strings nobody has searched before (they
  // cannot hit a cache), 20% rare words in oldest-first order. Oldest-first
  // on common words is a known timeout, so it is left out.
  const roll = Math.random()
  let q, sort
  if (roll < 0.5) {
    q = pick(COMMON_QUERIES)
    sort = Math.random() < 0.8 ? 'relevance' : 'date'
  } else if (roll < 0.8) {
    q = uniqueQuery()
    sort = 'relevance'
  } else {
    q = pick(RARE_QUERIES)
    sort = 'oldest'
  }
  // The search page asks for speeches and report titles together.
  const qs = `q=${encodeURIComponent(q)}&sort=${sort}`
  const params = { headers: AUTH, tags: { kind: 'search' } }
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/search/speeches?${qs}`, null, { ...params, tags: { kind: 'search', name: '/api/search/speeches' } }],
    ['GET', `${BASE_URL}/api/search/reports?${qs}`, null, { ...params, tags: { kind: 'search', name: '/api/search/reports' } }],
  ])
  for (const res of responses) serverErrors.add(res.status >= 500)
  // 200 is an answer; 429 is the busy refusal (three searches already
  // running across the two search endpoints). Anything else, a 503
  // timeout included, fails the check and the server_errors threshold.
  check(responses[0], {
    'search answered or refused fast': (r) => r.status === 200 || r.status === 429,
  })
}

export default function (data) {
  const roll = Math.random()
  if (roll < 0.6) group('report', () => viewReport(data))
  else if (roll < 0.7) group('browse', () => browse(data))
  else if (roll < 0.9) group('search', () => search())
  else group('people', () => viewPerson(data))
  sleep(1 + Math.random() * 2)
}

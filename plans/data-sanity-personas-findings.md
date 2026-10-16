# Data sanity personas: findings

16 Oct 2026

## How the run worked

Four Sonnet personas used the app the way its target users would: a historian who also called the JSON API as a data user, a Section 9A legal researcher, a journalist and a citizen. Each drove the API with curl, read rendered pages through headless Chromium, checked values against the production database with read-only SQL, and compared what it could against the official record on SPRS. An Opus triage pass then re-ran every repro, read the cause in the code of both repos, merged duplicates and set owner, severity and status. The spec is `plans/data-sanity-personas-brief.md`.

Environment: the Hansard API ran on port 8001 and a second Vite instance on 5174 with `VITE_API_URL=http://localhost:8001`, both on the production database. The API's CORS list is hard-coded to `localhost:5173`, so the headless browser ran with CORS checks off. A real browser on 5174 would fail every API call; that is a property of this test setup, not a finding.

SPRS coverage: the lawyer compared 5 Reports from 1963 to 1990 speech by speech and found them verbatim. Triage found the JSON endpoint for 2012 to 2025 that the personas missed and compared one 2019 Report, also verbatim. The other three personas tried the SPA URL with curl, got only the Angular shell and made no SPRS comparison. The method is under "SPRS method" below.

No code was changed and nothing was written to any database.

## Summary

Confirmed: 2 high, 5 medium, 7 low. Owners of confirmed findings: app 1, api 1, scraper 12. Explained: 4. Unconfirmed: 2.

| id | Title | Severity | Owner | Status | Group | Fix status | Records affected |
|---|---|---|---|---|---|---|---|
| DS-01 | Copied speech citation names an office fragment as the speaker | high | app | confirmed | G1 | fixed in code | 1,967 speeches, 31 labels, 148 Reports; plus 71 speeches with a lesser form |
| DS-02 | Reports with header-only text are counted and labelled as having text | low | api | confirmed | G1 | fixed in code | 654 Reports |
| DS-03 | Chiam See Tong has the wrong party for Parliaments 6 to 9 | high | scraper | confirmed | G5 | in progress | 4 Memberships |
| DS-04 | Duplicate Reports in one Sitting | medium | scraper | confirmed | G4 | open | 8 pairs (818 duplicated speeches) plus 3 stub Reports |
| DS-05 | Speaker labels that are sentence fragments or headings | medium | scraper | confirmed | G3, G2 | open | about 700 speeches by SQL shape; the scraper's own estimate is about 1,320 |
| DS-06 | Attendance lists the same MP twice, or lists rows that are not people | medium | scraper | confirmed | G2 | open | 10 duplicated pairs and 8 junk rows, in 12 Sittings |
| DS-07 | Attendance list of 25 Mar 1986 holds 5 names instead of about 77 | medium | scraper | confirmed | G6 | in progress | 1 Sitting |
| DS-08 | Sitting and session numbers missing | medium | scraper | confirmed | G4 | open | 3,942 Reports and 204 Sittings without a sitting number; 1,333 Sittings without a session number |
| DS-09 | Speaker labels that name a person are not linked | low | scraper | confirmed | G3, G2 | open | 131 speeches |
| DS-10 | Constituency names carry OCR typos | low | scraper | confirmed | G5 | in progress | 133 Memberships show more than one name |
| DS-11 | Report titles repeated, untrimmed or holding HTML | low | scraper | confirmed | G4 | open | 55 repeated, 362 untrimmed, 2 with `<br>` |
| DS-12 | `is_legislative_assembly` is true on Memberships in Parliaments 2 to 12 | low | scraper | confirmed | G4 | open | 68 Memberships |
| DS-13 | Person names in two formats, with honorifics, and almost no name variants | low | scraper | confirmed | G5 | in progress | 88 comma-form names; 2 of 573 Persons have a variant |
| DS-14 | Language markers such as "( In Malay )" are dropped | low | scraper | confirmed | none | deferred | not countable in SQL |
| DS-15 | `speech.kind` is NULL on every Speech | none | scraper | explained | G2 | applied to rehearsal | 1,044,594 speeches |
| DS-16 | Legislative Assembly Memberships are filed under Parliament 1 | none | scraper | explained | G5 | in progress | 97 Memberships; 73 people listed under Parliament 1 who never sat in it |
| DS-17 | The PAP has two party strings, so the party filter splits it | none | scraper | explained | G1, G5 | in progress | 1,151 Memberships |
| DS-18 | Later speeches in a run cite the name without the office | none | scraper | explained | G2 | open | not counted |
| DS-19 | "Terence Ho Wee San" and "Terence Ho" may be one Person | low | scraper | unconfirmed | G5 | open | 2 Persons |
| DS-20 | "The Chairman" linked on some speeches of a Report and not others | low | scraper | unconfirmed | none | open | 9 speeches in bill-367 |

All SQL below runs through the read-only wrapper: `cd api && uv run python <scratchpad>/tools/sql.py "<query>"`. Queries that filter `speech.speaker` scan the whole table and take 10 to 30 s; the wrapper's statement timeout cancels anything heavier.

## App

### DS-01. Copied speech citation names an office fragment as the speaker

- Severity: high. Owner: app. Status: confirmed.
- Fix status, 16 Oct: fixed in code, commit `22c1255`. A linked speech cites `person_name`, except a stored "Surname, Given" name (DS-13), which falls back to the label. An unlinked label uses the last bracket that starts with a title. Checked on the replica with every DS-01 label; 781,774 of 884,819 speeches change citation text, mostly because the honorific goes with `person_name`. "Mr Speaker" labels now cite the person without the office. Heading labels (DS-05) still give a citation such as "(SECTION III - REVENUE AND TAX CHANGES)".
- Personas: lawyer.
- App URL: http://localhost:5174/reports/president-address-256#s1 (copy-citation button on speech 1).
- API call: `GET /reports/president-address-256`, field `speeches[].speaker_label`.
- Expected: `Singapore Parliamentary Debates, Official Report (15 January 2016) vol 94 (Mr Lim Hng Kiang, Minister for Trade and Industry (Trade))` or any form that names Lim Hng Kiang.
- Actual: `Singapore Parliamentary Debates, Official Report (15 January 2016) vol 94 (Trade, Minister for Trade and Industry)`. The speaker's name is missing and "Trade" is given as the name.
- How expected was established: the API returns `speaker_label` "The Minister for Trade and Industry (Trade) (Mr Lim Hng Kiang)", `person_id` 197, `person_name` "Lim Hng Kiang". Triage ran the exact `parseSpeakerLabel` logic from `app/src/lib/citation.ts` in Node on the labels below.
- Repro:
  ```bash
  curl -s localhost:8001/reports/president-address-256 | python3 -c "import json,sys;s=json.load(sys.stdin)['speeches'][0];print(s['speaker_label'],s['person_name'])"
  ```
  ```sql
  select substring(speaker from '^The [^(]*\(([^)]*)\)') first_bracket, count(*), count(distinct speaker), min(speaker)
  from speech
  where speaker like 'The %(%(%'
    and speaker !~ '^The [^(]*\((Mr|Mrs|Ms|Miss|Mdm|Madam|Dr|Prof|Assoc|Er|BG|RAdm|LG|Col|LTC|MG|Encik|Inche|Haji|Hajjah|Tuan|Dato|Datuk|Sir|Rev|Capt|Maj|Cdr|Lt)[ .]'
  group by 1 order by 2 desc;
  ```
- Cause: `app/src/lib/citation.ts:10` defines `FIRST_BRACKET = /\(([^)]*)\)/`, and `:18-26` takes the first bracket as the name and the text before it as the office. When the office has its own bracket, the first bracket is part of the office. Outputs of the current code:
  - "The Minister for Trade and Industry (Trade) (Mr Lim Hng Kiang)" gives "(Trade, Minister for Trade and Industry)".
  - "The Acting Minister for Education (Higher Education and Skills) and Senior Minister of State for Defence (Mr Ong Ye Kung)" gives "(Higher Education and Skills, Acting Minister for Education)". The office is also cut short.
  - "The Second Minister for Defence (Services) (BG Lee Hsien Loong)" gives "(Services, Second Minister for Defence)".
  - "The Senior Minister of State for National Development (for the Minister for National Development) (Mr Desmond Lee)" gives "(for the Minister for National Development, Senior Minister of State for National Development)".
  - "The Minister of State for Communications (Cdre (Res) Teo Chee Hean)" gives "(Cdre (Res, Minister of State for Communications)".
- Lesser forms from the same function, where the name is right but the result is still off:
  - Unbalanced bracket, 12 speeches: "The Minister of State for Home Affairs (Dr Lee Boon Yang (for the Minister for Home Affairs)" gives "(Dr Lee Boon Yang (for the Minister for Home Affairs, Minister of State for Home Affairs)".
  - Name first and office in brackets, 59 speeches: "Dr Yeoh Ghim Seng (Mr Speaker)" gives "(Dr Yeoh Ghim Seng)". The office is lost because only labels that start with "The " are read as offices (`citation.ts:22`).
  - Heading or fragment labels (DS-05) give citations such as "(SECTION III - REVENUE AND TAX CHANGES)".
- Fix direction: all 1,967 speeches in the main group are linked, and `SpeechData.person_name` is already in the report response (`app/src/api/reports/getReport.ts:16`). Use `person_name` as the name whenever `person_id` is set, and take the office as the label text with the last name bracket and any "(for the ...)" bracket removed. For unlinked labels, take the last bracket that starts with a title (Mr, Dr, BG and so on) rather than the first. The scraper should defend too: label quality is DS-05 and DS-09. Add unit cases for each label above.
- Records affected: 1,967 speeches, 31 distinct labels, 148 Reports, all linked. Groups by first bracket: "Higher Education and Skills" 822, "Schools" 465, "Services" 235, "Trade" 191, "Industry" 115, "National Development Division" 93, "Cdre (Res" 19, "for the Minister for National Development" 10, "Law Division" 9, "Foreign Affairs" 5, "Policy" 3. The lesser forms add 71 speeches.
- Note: the lawyer's example URL (the 22 Feb 1990 Maintenance of Religious Harmony Bill) does not contain the "(Services)" label. The finding stands on the example above.

## API

### DS-02. Reports with header-only text are counted and labelled as having text

- Severity: low. Owner: api, with a scraper note. Status: confirmed.
- Fix status, 16 Oct: fixed in code, commit `8c69fd9`. A Report has text only when a Speech points at it, everywhere the API decides it (EXISTS on `speech.report_id`). The app drops the no-speeches notice. On the replica `text_report_count` goes from 41,683 to 41,029, and `/coverage` answers in 0.56 s cold.
- Personas: lawyer, journalist; the historian listed the same Reports as Explained.
- App URL: http://localhost:5174/reports/00068872-ZZ.00047415-ZZ_1%23id043_19551123_S0003_T00431-budget
- API call: `GET /reports/00068872-ZZ.00047415-ZZ_1%23id043_19551123_S0003_T00431-budget`
- Expected: a Report whose stored text is only the metadata header is marked as having no text, or the page does not say "The report has text".
- Actual: `is_text_available: true`, `speeches: []`. The page shows "The text couldn't be split into speeches. The report has text. Read it on the official record." The journalist found the stored `markdown_content` is 307 characters of header.
- How expected was established: API response plus the journalist's read of `markdown_content`; the scraper's data dictionary gives the count.
- Repro:
  ```bash
  curl -s 'localhost:8001/reports/00068872-ZZ.00047415-ZZ_1%23id043_19551123_S0003_T00431-budget' | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['is_text_available'],len(d['speeches']))"
  ```
  ```sql
  -- heavy: anti-join over every Report; it timed out in triage, the personas ran it earlier
  select count(*) from report r
  where octet_length(r.markdown_content) > 0
    and not exists (select 1 from speech s where s.report_id = r.id);
  ```
- Cause: `api/utils/text_availability.py:4` and `api/crud/report.py:45-51` treat any non-empty `markdown_content` as text. `/coverage` `text_report_count` (41,683 of 41,811) counts these Reports. On the scraper side, `populate/speeches.py:47-49` skips a Report when it finds no start-of-speech line, which leaves the header-only Reports with no rows. The scraper documents the 654 in `docs/data-dictionary.md:217` as budget procedural orders, annexes whose body is a list of PDF links, and Committee of Supply openers.
- Fix direction: decide what "has text" means. Either the API reports text as available only when the Report has speeches or a body past the header, or `NoticeNoSpeeches` (`app/src/components/reports/NoticeNoSpeeches.tsx:13-14`) drops the "The report has text" sentence. The scraper could also parse annex tables into DOCUMENT_TEXT rows.
- Records affected: 654 Reports with text and no speeches (scraper data dictionary, journalist and lawyer SQL agree). The journalist counted 525 of them under 700 characters, which is header only. Examples: report ids for slugs `00068872-ZZ.00047415-ZZ_1#id043_19551123_S0003_T00431-budget` (1955), `00000528-XA.00064533-ZZ_1#id049_19950123_S0007_T00221-written-answer` (1995 appendix).

## Scraper

### DS-03. Chiam See Tong has the wrong party for Parliaments 6 to 9

- Severity: high. Owner: scraper. Status: confirmed.
- Fix status, 16 Oct: in progress. G5 checked 178 Memberships against the Elections Department results. Outside Parliament 1 only Chiam's rows 359, 437 and 522 (to SDP) and 615 (to SPP) are wrong. Parliament 1 has 3 source errors and many errors in the hand-typed `data/colonial_la_members.json`: 61 rows change under the ballot-party rule. The cause: the parliament.gov.sg list holds one party per person, which the scraper copies onto every Parliament. Waiting on Royce's rulings, the commit lock and a rehearsal clone.
- Personas: historian, lawyer.
- App URL: http://localhost:5174/people/140-chiam-see-tong
- API call: `GET /people/140`, `memberships[].party`; also `GET /people?party=Singapore%20Democratic%20Alliance`.
- Expected: Singapore Democratic Party for Parliaments 6, 7 and 8 (1985 to 1996), Singapore People's Party for Parliament 9 (1997 to 2001), Singapore Democratic Alliance for Parliaments 10 and 11.
- Actual: "Singapore Democratic Alliance" on all six Memberships, speaker ids 359, 437, 522, 615, 714, 812. The SDA was formed in 2001.
- How expected was established: public record. Chiam led the SDP until 1993, left it in 1996, won Potong Pasir for the SPP in 1997, and the SPP joined the SDA when it formed in 2001.
- Repro:
  ```bash
  curl -s localhost:8001/people/140 | python3 -c "import json,sys;[print(m['parliament_number'],m['party']) for m in json.load(sys.stdin)['memberships']]"
  ```
  ```sql
  select id, name, parliament_number, party from speaker where person_id = 140 order by parliament_number;
  ```
- Cause: `speaker.party`, written per Parliament from the parliament.gov.sg former-MP page by `gateway/speakers_by_parliament.py:42,54` (`.mp-sort.party`). The source page itself gives SDA for Parliaments 6 to 11 (`mps_by_parliament.json`), so the scraper copies a source error. The source appears to show a person's later party on earlier Parliaments.
- Fix direction: add a per-Membership party override in the scraper for known cases, and check the other opposition members who changed party (for example members of the Barisan Sosialis, SDP and SPP across the 1980s and 1990s) against the election results.
- Records affected: 4 Memberships known wrong (359, 437, 522, 615). Other opposition members were not checked, so the true count may be higher.

### DS-04. Duplicate Reports in one Sitting

- Severity: medium. Owner: scraper. Status: confirmed.
- Fix status, 16 Oct: open. Queued for G4, after write #3. No commit yet.
- Personas: lawyer, journalist.
- App URLs: http://localhost:5174/sittings/1963-04-09 (two "BUDGET, MINISTRY OF LABOUR"), http://localhost:5174/sittings/2011-11-21 (two "Central Provident Fund (Amendment) Bill"), http://localhost:5174/sittings/2003-10-16 (stubs).
- API calls: `GET /sittings/1963-04-09`, `GET /search/reports?q=martial+arts+instruction&date_from=2003-10-16&date_to=2003-10-16`.
- Expected: one Report per SPRS topic.
- Actual, shape 1: 8 `html_file_name` values each have two Reports with different `report_id` values. In 7 pairs the speeches are identical (same count and same md5 of all transcripts in order); in 1 pair both have no speeches. Search returns each hit twice and the person pages count the speeches twice.
- Actual, shape 2: three Reports on 16 Oct 2003 have ids with the year typed as 1003 (`#032_10031016_S0003_T0009.html-#`, `#018_10031016_S0004_T0002.html-#`, `#011_10031016_S0006_T0005.html-#`), no speeches, and two have `<br>` in the title. Two duplicate real Reports that day: `#030_20031016_...` (Martial Arts Instruction (Repeal) Bill, 42 speeches) and `#017_20031016_...` (Recent deaths of three SAF servicemen, 109 speeches).
- How expected was established: SQL on `report.html_file_name` and speech hashes.
- Repro:
  ```bash
  curl -s localhost:8001/sittings/1963-04-09 | python3 -c "import json,sys;print([(r['report_slug'],r['title']) for r in json.load(sys.stdin)['reports'] if 'LABOUR' in r['title']])"
  ```
  ```sql
  select html_file_name, array_agg(id order by id), array_agg(report_id order by id)
  from report where coalesce(html_file_name,'') <> '' group by 1 having count(*) > 1;

  select r.id, (select count(*) from speech s where s.report_id = r.id),
         (select md5(string_agg(s.transcript, '|' order by s.ordinal)) from speech s where s.report_id = r.id)
  from report r where r.id in (39101,39104,24667,24668,21071,21081,20410,43638,38584,38588,24165,24174,20742,20816,23032,23045);

  select id, report_id, title from report where report_id ~ '_1003';
  ```
- Cause: `report.report_id` is whatever the SPRS search returns (`services/hansard_website.py:42`), and the scraper dedupes only on `report_id` (`populate/hansard_responses.py:85-87`, `populate/reports.py:15-17`, `gateway/hansard_search.py:98-103`, unique key at `database/report.py:36`). Two ids for one topic, and a source id with a typo, both pass. The scraper's `plans/duplicate-reports.md` covers only same-id duplicates.
- Fix direction: dedupe on `html_file_name` within a Sitting and drop the 1003 stubs in the scraper. The API could 301 the losing slug to the kept one so permalinks already shared keep working (ADR 0004 covers permanent URLs).
- Records affected: 16 Reports in 8 pairs, 818 duplicated speeches, plus 3 stubs. Pairs (report ids): 39101/39104 (1961-11-30 Merger), 24667/24668 (2004-03-17 Head O, 503 speeches each), 38584/38588 (1963-04-09), 20742/20816 (2011-11-21 CPF Bill), 23032/23045 (2007-05-22 Employment of Foreign Workers Bill). Pairs with a different `html_file_name` were not counted.

### DS-05. Speaker labels that are sentence fragments or headings

- Severity: medium. Owner: scraper; the app citation (DS-01) should not build a citation from such a label. Status: confirmed.
- Fix status, 16 Oct: open. Queued for G3 (census detector) and G2 (re-check on write #3 data). No commit yet.
- Personas: historian, lawyer, journalist, citizen.
- App URL: http://localhost:5174/reports/00000425-XA.00068254-ZZ_1%23id005_20020404_S0006_T00071-president-address#s194
- API call: `GET /reports/00000425-XA.00068254-ZZ_1%23id005_20020404_S0006_T00071-president-address`
- Expected: speeches 194 and 195 belong to Lee Hsien Loong, who is speaking at 193 ("Dr Wang Kai Yuen asked yesterday, 'Why is it so long?' ... I assure him ...").
- Actual: speeches 194 and 195 carry the label "Dr Wang Kai Yuen asked yesterday", unlinked. The page shows that phrase as a bold speaker label and the minister's words under it. Lee Hsien Loong's speech count is short by these rows.
- How expected was established: reading the transcript at 193 to 195.
- Repro:
  ```bash
  curl -s 'localhost:8001/reports/00000425-XA.00068254-ZZ_1%23id005_20020404_S0006_T00071-president-address' | python3 -c "import json,sys;sp=json.load(sys.stdin)['speeches'];[print(s['ordinal'],s['speaker_label'],'|',s['transcript'][:80]) for s in sp[192:195]]"
  ```
  ```sql
  select count(*) filter (where speaker ~ ' (asked|says|said|raised|also|echoes|mentioned|noted|replied|asks|queried|stated|suggested|yesterday|pointed|spoke)( |$)') verb_fragments,
         count(*) filter (where speaker ~ '^[^a-z]*[A-Z]{4}[^a-z]*$' and speaker !~ '^(Mr|Mdm|Madam|Hon)') all_caps,
         count(*) filter (where speaker ~ '^[\[(_*"]') leading_punct
  from speech where speaker_id is null and speaker <> '';
  -- 174, 192, 395
  ```
- Cause: `speech.speaker`, written by `_parse_speeches` in `services/speech.py:769`. A bold run at the start of a paragraph becomes the label (`_BOLD_RUN_RE` at `services/speech.py:292`, label taken near :826) unless one of the rules at `_is_bold_mid_sentence` (:676), the length and character check (near :853), the section-annotation check (near :860) or `_SECTION_BOUNDARY_HEADINGS` (near :871) fires. A bolded name at the start of a quoted question, a section heading or an italic caption passes them. The scraper already tracks this class as open: `docs/speech-fidelity-stopping-rule.md:83` ("about 1,320 rows (0.12%) are a heading or caption credited as a speaker") and `docs/vision.md:156`.
- Fix direction: in the scraper, reject a label that contains a finite verb ("asked", "says", "echoes"), starts with `[`, `(` or `_`, or is all capitals, and keep the row with the previous speaker or as a HEADING row. In the app, fall back to no citation button for an unlinked label that does not look like a name or office.
- Records affected: 174 verb fragments in 12 labels, 192 all-capital headings, 395 rows starting with punctuation (35 of these are real names behind a stray quote, see DS-09). Examples: "SECTION III - REVENUE AND TAX CHANGES" 86, "[Deputy Speaker" 72, "(Motion)" 56, "Dr Wang Kai Yuen asked yesterday" 50, "Mr Low Thia Khiang also echoes some of these sentiments" 29.

### DS-06. Attendance lists the same MP twice, or lists rows that are not people

- Severity: medium. Owner: scraper. Status: confirmed.
- Fix status, 16 Oct: open. Write #3 (plan v4) is on the replica. Its production ship is being run by the scraper loop session, outside this run. G2 re-checks the two queries on write #3 data. No commit yet.
- Personas: citizen.
- App URLs: http://localhost:5174/sittings/1958-04-23, http://localhost:5174/sittings/1959-12-10
- API call: `GET /sittings/1958-04-23`, `attendance[]`.
- Expected: one row per MP per Sitting, and only MPs.
- Actual: Abdul Hamid Bin Haji Jumat appears present and absent on 23 Apr 1958. On 10 Dec 1959 the list holds "**Mr Speaker:** I have received a message from His Excellency the Yang..." and "*Appendix, cols. 895-900" as absent members.
- How expected was established: SQL on `attendance`.
- Repro:
  ```bash
  curl -s localhost:8001/sittings/1958-04-23 | python3 -c "import json,sys;print([a for a in json.load(sys.stdin)['attendance'] if 'Hamid Bin Haji Jumat' in a['name']])"
  ```
  ```sql
  select st.sitting_date, a.speaker_id, sp.name, array_agg(a.is_present order by a.id), array_agg(a.id order by a.id)
  from attendance a join sitting st on st.id = a.sitting_id join speaker sp on sp.id = a.speaker_id
  where a.speaker_id is not null group by 1,2,3 having count(*) > 1;

  select a.id, st.sitting_date, a.is_present, left(a.speaker_name, 70)
  from attendance a join sitting st on st.id = a.sitting_id where a.speaker_name like '%*%';
  ```
- Cause: `attendance` rows are built in `services/attendance.py:692-716` (markdown PRESENT and ABSENT sections) and `:719-746` (JSON list). `_parse_entry_line` (`:578-596`) strips only a leading `* ` or `**` and a "Present:" or "Absent:" prefix, so body text after the list becomes rows. Nothing dedupes a name found in both sections, and `database/attendance.py` has no unique constraint on (sitting_id, speaker_id). The scraper's `docs/vision.md:129` says write #3 deletes 45 junk attendance rows; whether that covers these 18 is not checked.
- Fix direction: stop at the end of the list, drop rows with markup, dedupe on (sitting_id, speaker_id) preferring the source's present entry, then add the unique constraint. Re-run the two queries after write #3 ships.
- Records affected: 10 duplicated pairs (1958-04-23 Abdul Hamid, 1957-12-18 R. Jumabhoy, 1972-03-27 and 1981-03-24 Yeoh Ghim Seng, 1996-03-18 and 2005-03-07 Tan Soo Khoon, and 4 more) and 8 junk rows (attendance ids 29174, 39556, 53058, 53059, 53060, 53567, 53569, 70846). Each duplicate adds one to a present or absent count on the person page.

### DS-07. Attendance list of 25 Mar 1986 holds 5 names instead of about 77

- Severity: medium. Owner: scraper, with an api note. Status: confirmed.
- Fix status, 16 Oct: in progress. G6 found the cause: SPRS and the stored raw HTML hold the full list (76 present, 3 absent), and today's parser reads all 79. The 5 stored rows are the first 5 of the parse, left by an interrupted first run of stage 7 that committed one row at a time. Sittings 5941 (2 Dec 1996, 53 of 85) and 6009 (20 Jul 2005, 50 of 94) are truncated the same way. The fix is an insert-only completion of 150 rows, all linked, dry-run counted on the replica. No write and no commit yet.
- Personas: citizen.
- App URL: http://localhost:5174/sittings/1986-03-25
- API call: `GET /sittings/1986-03-25`
- Expected: about 77 rows; Parliament 6 Sittings average 76.8.
- Actual: 5 rows, all present (Abbas Abu Amin, Abdullah Bin Tarmugi, Ahmad Mattar, Ang Kok Peng, Yeoh Ghim Seng), 20 Reports, `is_attendance_available: true`. It is the only Sitting with fewer than 20 attendance rows.
- How expected was established: SQL over every Sitting.
- Repro:
  ```bash
  curl -s localhost:8001/sittings/1986-03-25 | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d['attendance']),d['is_attendance_available'])"
  ```
  ```sql
  select st.id, st.sitting_date, count(a.id), length(st.attendance_list::text)
  from sitting st left join attendance a on a.sitting_id = st.id
  group by st.id having count(a.id) < 20;
  -- 5988, 25-3-1986, 5, 2
  ```
- Cause: `sitting.attendance_list` is `[]` for this Sitting, so the rows come from the markdown path in `services/attendance.py:692-716`, which stopped after five names. The API sets `is_attendance_available` from `len(attendances) > 0` (`api/services/sitting.py:108`), so a partial list is shown as complete.
- Fix direction: re-fetch the Sitting from SPRS (`getHansardReport`, see SPRS method) and re-parse. Optionally the scraper flags a Sitting whose list is far below the Parliament's seat count.
- Records affected: 1 Sitting; every other Parliament 6 member is missing one present or absent mark for it.

### DS-08. Sitting and session numbers missing

- Severity: medium. Owner: scraper. Status: confirmed.
- Fix status, 16 Oct: open. Queued for G4, after write #3. No commit yet.
- Personas: lawyer, citizen.
- App URLs: http://localhost:5174/reports/00075611-WA.00072393-ZZ_1 (no "Sitting number" in the header), http://localhost:5174/sittings/2007-10-22
- API calls: `GET /reports/00075611-WA.00072393-ZZ_1` (`sitting_number: null`), `GET /sittings/2007-10-22` (`sitting_number: null, session_number: null`), `GET /sittings?parliament_number=9` (`session_number: null` on all 121).
- Expected: a sitting number on every Report and Sitting, and a session number on every Sitting.
- Actual: 3,942 Reports dated 2003 to 2011 have no sitting number (2003 56, 2004 567, 2005 517, 2006 320, 2007 655, 2008 550, 2009 517, 2010 555, 2011 205). 204 Sittings from 10 Nov 2003 to 11 Apr 2011 have no `sitting_no`. 1,333 of 1,719 Sittings have no `session_no`; session numbers exist only from 10 Sep 2012.
- How expected was established: SQL, and the lawyer found "Sitting No" in the stored markdown header of other Reports (for example report 42670: `Parliament No: 8 / Session No: 2 / Volume No: 63 / Sitting No: 11`).
- Repro:
  ```bash
  curl -s localhost:8001/sittings/2007-10-22 | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['sitting_number'],d['session_number'])"
  ```
  ```sql
  select extract(year from sitting_date)::int, count(*) from report where sitting_number is null group by 1 order by 1;
  select count(*), count(*) filter (where session_no is null), count(*) filter (where sitting_no is null) from sitting;
  ```
- Cause: `report.sitting_number` comes from the search hit's `sittingNo` (`services/report.py:51-55`), NULL when SPRS sends none. `sitting.sitting_no` and `sitting.session_no` come from `services/hansard_sitting_date_response.py:29-32` through `_get_int`, which returns None on a bad value; the old-format response carries no session number.
- Fix direction: backfill from the markdown header ("Sitting No", "Session No") or from `getHansardTopic`'s `sittingNo` and `sessionNo`. The app already hides a missing value (`app/src/components/reports/ListReportMetadata.tsx:29`, `app/src/components/sittings/ListSittingsGrouped.tsx:12`).
- Records affected: 3,942 Reports, 204 Sittings (sitting number), 1,333 Sittings (session number). Examples: Report ids 22788 and 22779 (Penal Code 2007), 24913, 24842, 24808.

### DS-09. Speaker labels that name a person are not linked

- Severity: low. Owner: scraper. Status: confirmed. One aggregate finding, per scenario 2 of the brief.
- Fix status, 16 Oct: open. Queued for G3 (census detector) and G2 (re-check on write #3 data). No commit yet.
- Personas: historian, lawyer, journalist, citizen.
- App URL: any Report with "Dr Yeoh Ghim Seng (Mr Speaker)"; use the SQL to find one.
- API call: `GET /reports/{slug}`, `speeches[].person_id` is null on these.
- Expected: linked to the named Person. Persons exist for Yeoh Ghim Seng, Tan Soo Khoon, George Oehlers and David Marshall.
- Actual: unlinked; the person pages undercount them.
- How expected was established: SQL.
- Repro:
  ```sql
  select count(*) filter (where speaker ~ '\((Mr|Mrs|Ms|Dr|Prof|Assoc|Mdm|Er|Col|BG|Maj|Datuk|Tuan|Encik|Haji|Dato|Inche|Sir)[ .]') bracket_named,
         count(*) filter (where speaker ~ '^[^(]+ \(Mr Speaker\)$') name_then_speaker,
         count(*) filter (where speaker ~ '^"(Mr|Mrs|Ms|Dr|Mdm|Miss|Inche|Encik|Sir) ') leading_quote
  from speech where speaker_id is null;
  -- 96, 59, 35
  ```
- Cause: `speech.speaker_id`, resolved by `_resolve_speech_speaker_id` in `populate/speaker_links.py:198-252`. `_preclean` (`:80-96`) strips a trailing " Mr Speaker," only without brackets (`_TRAILING_MR_SPEAKER_RE`, `:68`). In the bracket branch (about `:236-243`) "Mr Speaker" is taken as the bracketed name, which resolves to nothing. No rule strips a leading `"`. The scraper's `plans/speaker-attribution-push-proposals.md:60` lists the leading-quote fix as "Not proposed".
- Fix direction: in `_preclean`, treat "Name (Mr Speaker)" as the name before the bracket and strip a leading quote.
- Records affected: 131 speeches (96 with a bracketed titled name in 18 labels, 35 with a leading quote in 5 labels). Examples: "Dr Yeoh Ghim Seng (Mr Speaker)" 23, "Mr Tan Soo Khoon (Mr Speaker)" 14, "Sir George Oehlers (Mr Speaker)" 10, '"Mr David Marshall' 10, "Mr Wong Kan Song" (typo for Wong Kan Seng) 9.

### DS-10. Constituency names carry OCR typos

- Severity: low. Owner: scraper; the API could normalise as a stopgap. Status: confirmed.
- Fix status, 16 Oct: in progress. G5 mapped all 257 strings against the Elections Department division lists: 656 attendance rows and 128 Memberships change, and Memberships with more than one name drop from 133 to 11, all real seat moves. Waiting on Royce's rulings, the commit lock and a rehearsal clone.
- Personas: historian, lawyer, citizen.
- App URL: http://localhost:5174/people/29-lee-kuan-yew
- API call: `GET /people/29`, `memberships[].constituencies`.
- Expected: one name per Membership unless the member changed seat.
- Actual: Parliament 2 "Tanjong Pagar, Tanjong Pagar."; Parliament 5 "Taniong Pagar, Tanjong Pagar, Tarliong Pagar"; Parliament 10 "Tanjong Pagar, TanjongPagar". Other examples from the personas: "Kreat Ayer", "Fanner Park", "MarineParade", "Sembawano", "Ang Mo Klo", and non-places such as "Cols 0895-0900" and "1".
- How expected was established: SQL on `attendance.location_name`.
- Repro:
  ```bash
  curl -s localhost:8001/people/29 | python3 -c "import json,sys;[print(m['parliament_number'],m['constituencies']) for m in json.load(sys.stdin)['memberships']]"
  ```
  ```sql
  select count(distinct location_name),
         (select count(*) from (select location_name from attendance where location_name <> '' group by 1 having count(*) <= 3) t) rare,
         (select count(*) from (select speaker_id from attendance where speaker_id is not null and location_name <> '' group by 1 having count(distinct location_name) > 1) t) multi
  from attendance;
  -- 257, 100, 133
  ```
- Cause: `services/attendance.py:554-565` (`_parse_name_and_location`) takes the first bracket as the location with no canonical mapping. The API lists distinct values as stored (`api/crud/attendance.py:48-64`).
- Fix direction: a constituency table per Parliament in the scraper, mapping OCR variants to the canonical name. Some of the 133 are real seat changes (David Marshall, Cairnhill to Anson) and some are GRC renames, so the mapping must keep those.
- Records affected: 257 distinct names, 100 of them used 3 times or fewer; 133 Memberships show more than one name.

### DS-11. Report titles repeated, untrimmed or holding HTML

- Severity: low. Owner: scraper. Status: confirmed.
- Fix status, 16 Oct: open. Queued for G4, after write #3. No commit yet.
- Personas: historian, lawyer, journalist.
- App URL: http://localhost:5174/reports/00075611-WA.00072393-ZZ_1
- API call: `GET /reports/00075611-WA.00072393-ZZ_1`
- Expected: "PENAL CODE (AMENDMENT) BILL".
- Actual: "PENAL CODE (AMENDMENT) BILL,PENAL CODE (AMENDMENT) BILL". The lawyer found SPRS prints the same doubled string, so the source is the origin. Others: "\tBUDGET, MINISTRY OF LABOUR" (leading tab), "MARTIAL ARTS INSTRUCTION (REPEAL) BILL<br> ".
- How expected was established: SQL and SPRS.
- Repro:
  ```sql
  select count(*) filter (where title like '%,%' and trim(split_part(title,',',1)) = trim(split_part(title,',',2))) repeated,
         count(*) filter (where title ~ '^\s|\s$') untrimmed,
         count(*) filter (where title ~ '<[a-zA-Z/]') html
  from report;
  -- 55, 362, 2
  ```
- Cause: `report.title` is written at `services/report.py:59` from the search hit's title (`services/hansard_website.py:40`). The only transforms are `fix_mojibake` (`:45`), newline to space (`:28`) and lowercase-bracket stripping (`:29-40`). Nothing trims, strips HTML or collapses repeats. `original_title` keeps the raw value.
- Fix direction: trim, strip tags, and collapse a comma-joined title whose parts are equal after trimming. Where the parts differ (grouped questions such as report 22751 "CYBER/GAMING CAFES"), keep the first part as the title and the rest as subtitles.
- Records affected: 55 repeated, 362 untrimmed, 2 with `<br>`. Examples: report 22751 (12 Nov 2007), 24913 (16 Oct 2003), 23032 (22 May 2007), 38588 (9 Apr 1963).

### DS-12. `is_legislative_assembly` is true on Memberships in Parliaments 2 to 12

- Severity: low. Owner: scraper; the API passes it through. Status: confirmed.
- Fix status, 16 Oct: open. Queued for G4, after write #3; it depends on G5's DS-16 choice. No commit yet.
- Personas: historian, lawyer, citizen, journalist.
- App URL: none; the app does not render the flag.
- API call: `GET /people/29`, `memberships[].is_legislative_assembly` is true on all 12 Memberships, including Parliament 12 (2011 to 2015).
- Expected: true only on the Membership that stands for the 1955 to 1965 Assembly.
- Actual: true on 68 Memberships in Parliaments 2 to 12 (19, 14, 12, 10, 5, 2, 2, 1, 1, 1, 1).
- How expected was established: SQL.
- Repro:
  ```sql
  select parliament_number, count(*) from speaker where is_legislative_assembly group by 1 order by 1;
  ```
- Cause: `gateway/speakers_by_parliament.py:43,55` sets the flag when the parliament.gov.sg page for that Parliament has a `.formermp-legislative` element, which the site shows on every later page of a former Assembly member. The scraper's `plans/person-identity.md:81` calls the mix "expected".
- Fix direction: set the flag only on the Parliament 1 row that holds the Assembly Membership (see DS-16), or have the API stop exposing it. `GET /people?parliament_number=0` uses the flag (`api/services/person.py:43-44`) and returns the same 97 people either way.
- Records affected: 68 Memberships. Examples: Lee Kuan Yew Parliaments 2 to 12, Goh Keng Swee 2 to 5, Toh Chin Chye 2 to 6, Ho Kah Leong 7 and 8.

### DS-13. Person names in two formats, with honorifics, and almost no name variants

- Severity: low. Owner: scraper. Status: confirmed.
- Fix status, 16 Oct: in progress. G5 proposes a stage 9 rule (`invert_to_natural` plus a decoration strip) and 4 hand decisions: 90 `canonical_name` values change, person ids stay, old slugs redirect by id. `name_variants` from speech labels is a feature, left out. Waiting on Royce's rulings.
- Personas: historian, lawyer.
- App URL: http://localhost:5174/people/47-rajaratnam-s, http://localhost:5174/people
- API call: `GET /people`, `GET /people/171`
- Expected: one name order, no honorific in the canonical name, and the spellings used in speech labels listed as variants.
- Actual: 88 of 573 names use "Surname, Given" ("Rajaratnam, S", "Lee Siew Choh, Dr", "Chen Seow Phun, John, Dr"); the historian counted 27 with a title or decoration ("Lee Hong Chuang BBM"). `name_variants` is built only from Membership names (`api/services/person.py:117-123`), and only 2 Persons have one. "Lim Chin Siong" finds nothing because the Person is stored as "Lim Ching Siong".
- How expected was established: SQL.
- Repro:
  ```sql
  select count(*) filter (where canonical_name like '%,%') from person;   -- 88
  select count(*) from person p where exists (select 1 from speaker s where s.person_id = p.id and s.name <> p.canonical_name);   -- 2
  ```
- Cause: `person.canonical_name` is the most frequent `speaker.name` in the cluster (`services/person.py:76-81`, written at `populate/persons.py:40`). Names are never inverted; `utils/names.py` `invert_to_natural` is used only for matching. The scraper's `plans/person-identity.md:41` already notes the 88. There is no `name_variants` column; the API derives the field.
- Fix direction: store a display name in "Given Surname" order without honorifics, and have the API add the distinct speech-label spellings of linked speeches to `name_variants`.
- Records affected: 88 comma-form names. Examples: Rajaratnam, S (47); Lee Siew Choh, Dr (171); Chen Tien Lap, Bernard; Tan Keng Yam, Tony; Devan Nair, Mrs.

### DS-14. Language markers such as "( In Malay )" are dropped

- Severity: low. Owner: scraper. Status: confirmed.
- Fix status, 16 Oct: deferred. Deferred by the brief: it needs a new column.
- Personas: lawyer.
- App URL: http://localhost:5174/reports/00069608-ZZ.00061888-ZZ_1%23id013_19900222_S0003_T00033-bill#s119
- API call: `GET /reports/00069608-ZZ.00061888-ZZ_1%23id013_19900222_S0003_T00033-bill`, speeches 119 and 169.
- Expected: "The Senior Parliamentary Secretary to the Minister for Education (Encik Sidek bin Saniff) ( In Malay ): Mr Speaker, ..." as SPRS prints it, so a researcher knows the speech was delivered in Malay and the text is a translation. Same for speech 169, Ong Teng Cheong "( In Mandarin )".
- Actual: the label has no marker and the transcript starts at "Mr Speaker, ...".
- How expected was established: SPRS `getHansardTopic` for `013_19900222_S0003_T0003` against the API.
- Repro:
  ```bash
  curl -s 'localhost:8001/reports/00069608-ZZ.00061888-ZZ_1%23id013_19900222_S0003_T00033-bill' | python3 -c "import json,sys;sp=json.load(sys.stdin)['speeches'];[print(o,sp[o-1]['speaker_label'],'|',sp[o-1]['transcript'][:40]) for o in (119,169)]"
  ```
- Cause: `_LANGUAGE_NOTE_RE` at `services/speech.py:48-51`, applied to the label at `:803` and `:831` and to the transcript start at `:919-921`. The scraper records the drop in `docs/data-loss-register.md:56` and lists vernacular marking as open in `docs/vision.md:156`.
- Fix direction: keep the language in a column (for example `speech.language`) and show it beside the label.
- Records affected: not countable in SQL, because the marker is discarded. Count "( In " in SPRS text to size it.

## Explained

### DS-15. `speech.kind` is NULL on every Speech

- Status: explained. Owner: scraper. Personas: historian, lawyer, journalist, citizen. Three rated it high and the journalist medium.
- Fix status, 16 Oct: applied to rehearsal. Write #3 (plan v4) fills `speech.kind` on the replica. Its production ship is being run by the scraper loop session, outside this run. G2 re-checks the kind commits on write #3 data. No commit yet.
- Actual: `select kind, count(*) from speech group by 1` returns one row, NULL 1,044,594.
- Why: the scraper parser sets `kind` on every row since commit `2eef141` (`services/speech.py:587-601`, stored at `populate/speeches.py:58`). Stored rows get a kind only when write #3 ships. `docs/adr/0009-speech-kind-column.md:3` says "Write #3 fills the column for stored rows, so stored rows have no kind yet", and `docs/vision.md:65` says write #3 is "rehearsed on a replica and not shipped". After it ships, 4,146 rows in 162 held Reports stay NULL by design.
- Did ee80a9b to 64e4128 ship dead code? No. The code is inert until write #3 ships, and its NULL fallback reproduces the behaviour from before those commits exactly:
  - `app/src/components/reports/RowSpeech.tsx:31-34`: with no kind, a row with no label is muted and a row with a label is body text. This is the old `isProcedural={!hasSpeakerLabel}` rule from before 8f7c514.
  - `app/src/components/reports/ListSpeeches.tsx:22-36`: a NULL kind is neither CHAMBER_EVENT nor EDITORIAL_NOTE, so `getPreviousSpeakerLabel` returns the immediately previous label, the same as the old `report.speeches[index - 1]?.speaker_label` check.
  - The API passes `kind` through as `Optional[SpeechKind]` (`api/schemas/report.py:13`, `api/schemas/search.py:17`) and has no fallback of its own.
  - Nobody has seen the feature work on real data. Re-run one Report per era after write #3 ships.
- Same dependency: write #3 also unlinks 465 stored rows in ten Reports whose speaker the scraper knows is wrong (`docs/adr/0009-speech-kind-column.md`, `docs/vision.md:159`) and deletes 45 junk attendance rows (`docs/vision.md:129`). Until it ships, the app shows those 465 rows under the wrong person.
- What the personas saw that is pre-existing behaviour, not a kind bug: chamber events and notes break a speaker's run, headings render as speech rows, and a long run repeats the label only for screen readers (`RowSpeech.tsx:60-63`, by design).

### DS-16. Legislative Assembly Memberships are filed under Parliament 1

- Status: explained. Owner: scraper. Personas: historian, lawyer, citizen, journalist.
- Fix status, 16 Oct: in progress. G5 recommends moving the 71 Assembly-only rows to Parliament 0, with two stage 8 constant changes in the same change, which keeps 0 speech and attendance links moving in simulation. The code and data must land together, so after write #4. Waiting on Royce's rulings.
- Actual: no `speaker` row has `parliament_number = 0`. 97 Assembly Memberships are stored as Parliament 1. `GET /people?parliament_number=1` returns 136 people, 73 of whom never sat in a Parliament 1 Report (David Marshall 499, Lim Ching Siong 513, Ong Eng Guan 511). Lee Kuan Yew's one Parliament 1 row covers both the Assembly and 1965 to 1968.
- Why: the `/coverage` known gaps say so (`app/src/constants/coverage/constants.ts:149`). The scraper's `scripts/load_colonial_la_speakers.py:12-26` loads the Assembly members as Parliament 1, and `gateway/speakers_by_parliament.py:14` has no page for Parliament 0. The scraper's own `docs/data-dictionary.md:38,204` says "Parliament 0 is the colonial LA", which contradicts the data.
- Worth fixing anyway: a historian filtering People by Parliament 1 gets 73 wrong names and the people page does not warn. Either the scraper stores Assembly Memberships as Parliament 0, or the API maps an `is_legislative_assembly` Parliament 1 row with no Parliament 1 Report to Parliament 0.

### DS-17. The PAP has two party strings, so the party filter splits it

- Status: explained. Owner: scraper, with an api option. Personas: historian, citizen.
- Fix status, 16 Oct: in progress. The API stopgap is fixed in code, commit `47f59d7`: `/parties` lists one PAP string and either spelling returns 347 people on the replica. The stored strings still differ until G5's scraper normalisation ships.
- Actual: `/parties` lists "People's Action Party" (straight apostrophe, 853 Memberships, 262 people) and "People’s Action Party" (curly, 298 Memberships, 85 people). `GET /people?party=` with either returns only its own set.
- Why: `/coverage` discloses "two spellings of People's Action Party" (`app/src/constants/coverage/constants.ts:150`). The source site changed apostrophes between scrape eras (`gateway/speakers_by_parliament.py:42,54`; scraper `plans/person-identity.md:73-74`).
- Worth fixing anyway: normalising the apostrophe in the party filter and the party list (`api/crud/membership.py:47,56`) would merge the two. The two strings look the same in the dropdown, so a user cannot tell which to pick.

### DS-18. Later speeches in a run cite the name without the office

- Status: explained. Owner: scraper (source labels). Personas: lawyer.
- Fix status, 16 Oct: open. Explained, no data fix. Since `22c1255` these citations use `person_name`, so the name form matches across a run; the office still shows only where the label prints it. G2 re-checks on write #3 data.
- Actual: in http://localhost:5174/reports/bill-364 speech 2 is "The Minister for Law (Mr K Shanmugam)" and later speeches are "Mr K Shanmugam", so their citations read "(Mr K Shanmugam)" without the office.
- Why: the Official Report prints the label that way; triage saw `<strong>Mr K Shanmugam</strong>:` in the SPRS JSON for 7 May 2019. The citation uses the label as printed. A fix in DS-01 that prefers `person_name` would at least make the name form match.

## Unconfirmed

### DS-19. "Terence Ho Wee San" and "Terence Ho" may be one Person

- Severity: low. Owner: scraper. Personas: historian.
- Fix status, 16 Oct: open. G5 found two people: separate parliament.gov.sg records with different Chinese names, and `person_decisions.json` already keeps them distinct. G5 recommends closing this as rejected; Royce decides.
- Evidence: Person 389 "Terence Ho Wee San" has one Membership, speaker 1055, Parliament 13, party "Nominated Member of Parliament". Person 496 "Terence Ho" has one Membership, speaker 1337, Parliament 15, also a Nominated Member. Same name stem and same seat type make one man likely, but nothing in the database proves it.
- To confirm: check the Parliament 15 NMP list on parliament.gov.sg. If one man, add a merge to the scraper's `person_decisions.json`.

### DS-20. "The Chairman" linked on some speeches of a Report and not others

- Severity: low. Owner: scraper. Personas: journalist.
- Fix status, 16 Oct: open. Not in any group of this run. Open.
- Evidence: in bill-367 (8 May 2019) "The Chairman" is linked to Charles Chong (Person 165) on 43 speeches and unlinked on 9. Triage did not re-run it. Unlinked "The Chairman" is by design when the chair can't be resolved, so this may be correct if the chair changed.
- To confirm: list the 9 ordinals and check whether a different member took the chair around them.

## Rejected

- Second, Third Reading and Committee stage are not distinguishable (lawyer F15): a feature request, not a data error.
- 541 attendance rows have a blank `location_name` (citizen): SQL finds 0 rows with an empty string.
- The 2005-02-28 duplicate pair has 503 speeches each (lawyer F5): both Reports have 0 speeches. The pair is still a duplicate (DS-04); the 503 belongs to the 2004-03-17 pair.
- "Speech text exists after 13 Aug 2012" as a finding (journalist F6, citizen 10): true, but a stale note in the brief, not a data bug. See the reconciliation below.

## Known-gap reconciliation

### Report text after 13 Aug 2012

The known gap "no Report text after 13 Aug 2012" in decision 6 of `plans/data-sanity-personas-brief.md` is out of date. Triage counted Reports with non-empty `markdown_content` by year:

| Year | Reports | With text |
|---|---|---|
| 2011 | 382 | 382 |
| 2012 | 1,120 | 1,117 |
| 2013 | 1,071 | 1,065 |
| 2014 | 944 | 939 |
| 2015 | 665 | 659 |
| 2016 | 1,180 | 1,175 |
| 2017 | 1,263 | 1,253 |
| 2018 | 1,231 | 1,220 |
| 2019 | 1,248 | 1,240 |
| 2020 | 1,350 | 1,339 |
| 2021 | 2,444 | 2,434 |
| 2022 | 2,647 | 2,634 |
| 2023 | 2,315 | 2,305 |
| 2024 | 2,323 | 2,312 |
| 2025 | 914 | 909 |

```sql
select extract(year from sitting_date)::int, count(*), count(*) filter (where octet_length(markdown_content) > 0)
from report where sitting_date >= '2011-01-01' group by 1 order by 1;
```

The post-2012 load landed on 14 Oct 2026, and commit `14ce034` removed the gap from the app. `/coverage` reports text from 22 Apr 1955 to 8 Apr 2025, and attendance to the same date. Only 128 of 41,811 Reports have no text.

Effects on this run:

- No persona marked anything Explained on the strength of the 2012 gap, so nothing needed reopening.
- Scenario 2 of the user-stories brief (a Parliament 14 "COE" search that finds only title matches on text-less Reports) can no longer happen as written. Title-only matching still exists for the 128 text-less Reports, most of them types SPRS publishes without text, but no persona exercised it. A later run should search a title that matches one of them.
- Scenario 1 of this run's brief says search covers "only Speeches with text before Aug 2012". That is also stale; the journalist got 2019 and 2021 speech hits.

Files that still state the old fact. None is shown to users, so there is no app finding:

- `plans/data-sanity-personas-brief.md:38` (decision 6) and `:62` (scenario 1).
- `plans/hansard-user-stories-brief.md:13`, `:41`, `:67`, `:94`, `:108`.
- `plans/hansard-user-stories-execution.md:51`, `:1223`, `:1442`, `:1482` (attendance ending 13 Aug 2012). `plans/hansard-user-stories.md:32` and `:52` already record the change.

The app copy checked (the `/coverage` page, the search text-coverage notice in `app/src/components/search/NoticeTextCoverage.tsx`, `app/src/constants/coverage/constants.ts`) is driven by `/coverage` or already updated. It is correct.

### Party strings

Party strings are not cleaned. `/parties` returns 18 values: Barisan Sosialis, Colonial Government, Independent Singapore Party Alliance, Labour Front, NA, Nominated Member of Parliament, Non-Constituency Member of Parliament, Non-partisan, People's Action Party, People’s Action Party, "People's Action Party, Barisan Sosialis", Progress Singapore Party, Singapore Democratic Alliance, Singapore Democratic Party, Singapore People's Party, Singapore Progressive Party, Unknown, Workers' Party.

- Two PAP spellings: DS-17.
- "NA", "Unknown" and the seat types (Nominated Member, Non-Constituency Member) are stored in the party column. `/coverage` discloses placeholders.
- "People's Action Party, Barisan Sosialis" is one Membership (Chan Sun Wing, Parliament 1), who moved from the PAP to the Barisan in 1961.
- Wrong values, not just uncleaned ones: DS-03.

## SPRS method

Curl on `https://sprs.parl.gov.sg/search/#/...` returns only the Angular shell. Both JSON endpoints below are what the scraper itself calls (`settings.py:16-18` in the scraper). Both need POST; a GET answers 500.

Reports to 2012 (`report_version` sprs2), one topic at a time, keyed by `report.html_file_name`:

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"id":"013_19900222_S0003_T0003"}' \
  https://sprs.parl.gov.sg/search/getHansardTopic
```

The response has `title`, `sittingNo`, `sessionNo`, `volumeNo`, `parlNo`, `content` and `htmlContent`. The text has inline "Column: N" markers to strip before comparing.

Reports from 10 Sep 2012 (sprs3), one whole Sitting at a time, with the date as DD-MM-YYYY:

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"sittingDate":"07-05-2019"}' \
  https://sprs.parl.gov.sg/search/getHansardReport/
```

The response has `metadata`, `attendanceList`, `takesSectionVOList` (oral business: `title`, `sectionType`, `content` HTML) and `writtenAnswersVOList`. Pick the sections whose `title` matches the Report. Two sections can share a title, one per reading.

Comparison: normalise both sides, then check that each API transcript is a substring of the SPRS text. This is the script triage used (`python3 -I compare.py sitting.json api_report.json "<title fragment>"`):

```python
import json, re, sys, html
sprs, api, title_part = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(sprs))
secs = [s for s in (d.get('takesSectionVOList') or []) + (d.get('writtenAnswersVOList') or [])
        if title_part.lower() in (s.get('title') or '').lower()]
def norm(t):
    t = re.sub(r'</?(p|br|div|li|tr|td|table|h[1-6])\b[^>]*>', ' ', t)
    t = re.sub(r'<[^>]+>', '', t); t = html.unescape(t)
    t = t.replace(' ', ' ').replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    t = re.sub(r'[_*]', '', t)
    t = re.sub(r'\s+', ' ', t)
    return re.sub(r' ([.,;:\])])', r'\1', re.sub(r'([\[(]) ', r'\1', t)).strip()
src = ' '.join(norm(s.get('content') or '') for s in secs)
a = json.load(open(api))
miss = [(s['ordinal'], norm(s['transcript'])[:90]) for s in a['speeches'] if norm(s['transcript']) and norm(s['transcript']) not in src]
print('speeches', len(a['speeches']), 'not verbatim', len(miss)); [print(m) for m in miss[:8]]
```

Strip block tags to a space and inline tags to nothing. Replacing every tag with a space gave 7 false misses on bill-364, all around `[<em>...</em>]`.

Results so far, all verbatim after normalising:

| Report | Date | Speeches | Who |
|---|---|---|---|
| Internal Security Council motion (id 38580) | 9 Apr 1963 | 556 of 557; the miss is a `*` footnote glyph | lawyer |
| CPF (Amendment) Bill (id 34248) | 7 Apr 1978 | 28 of 28 | lawyer |
| Maintenance of Religious Harmony Bill (id 28223) | 22 Feb 1990 | 359 of 359 | lawyer |
| Constitution (Amendment No. 3) Bill (id 30039) | 3 Jan 1991 | 206 of 206 | lawyer |
| Penal Code (Amendment) Bill (id 22788) | 22 Oct 2007 | 489 of 496; the 7 were the lawyer's tag spacing | lawyer |
| Protection from Online Falsehoods and Manipulation Bill (bill-364) | 7 May 2019 | 415 of 415 | triage |

No derived-text difference was found, so scenario 3 of the brief produced no finding. The official record URL for sprs2 (`#/topic?reportid={html_file_name}`) resolved for 5 of 5 Reports. The sprs3 form (`#/sprs3topic?reportid=bill-364`) was not checked, because it needs a browser.

## Coverage: what was checked and looked right

Counts and totals:

- `/coverage` counts match SQL: Reports 41,811, with text 41,683, speeches 1,044,594, linked 961,901, Persons 573, Memberships 1,437, Sittings 1,719, attendance 135,072.
- `/parliaments` sums match `/coverage`. `/sittings?parliament_number=9` gives 121 Sittings and 2,139 Reports, the same as `/parliaments`.
- Every Sitting has at least one Report and one attendance row. No two Sittings share a date. Every Person has at least one Membership, and no two Persons share a name after normalising.
- Parliament first and last sitting dates match the general-election gaps from Parliament 1 (8 Dec 1965) to Parliament 14 (24 Aug 2020).

Person pages:

- David Marshall: 580 Reports and 6,797 speeches, the same as SQL, newest first, 1955 to 1963.
- Lee Kuan Yew: per-Parliament speech counts add up to the Membership counts.
- Abbas Abu Amin, Parliaments 5 to 7: present plus absent equals each Parliament's sitting count.
- Lee Siew Choh has a different party per Membership, so party is stored per Membership.
- J B Jeyaretnam in Parliament 9 shows as Non-Constituency Member. Chiam See Tong's constituency is Potong Pasir in Parliaments 6 to 11.

Search:

- Speech search counts equal SQL with the same `english` expressions: "Operation Coldstore" 5, "merger" in 1963 314, plus bill filter 31, single day 5 Apr 1963 13, "Mas Selamat" 277, person filter Wong Kan Seng 128, "merger" for Lee Kuan Yew 358.
- Date bounds are inclusive at both ends. Report type and Parliament filters did not leak.
- Sort is monotone across 3 pages. No (slug, ordinal) repeats across pages. Every snippet has a highlight.
- "Little India Riot" Report search: 3 results, equal to SQL. "COE" gives 97 with stemming, as expected.
- The app search page shows the same results as the API.

Reports and linking:

- Ordinals ascend from 1 with no gaps in 8 sampled Reports. `#s{ordinal}` anchors exist and a search hit opens on the right speech.
- "Mr Speaker" links to the right Speaker per era (Oehlers 1963, Tan Soo Khoon 1990 and 1991, Tan Chuan-Jin 2019). "The Prime Minister" in 1963 and 1985 links to Lee Kuan Yew.
- Search hits map to the right Person: Ong Pang Boon, Lee Siew Choh, K Shanmugam, Alex Yam, Tan Yia Swam, David Marshall.
- The citation title switches to "Singapore Legislative Assembly Debates" for the Assembly. Dots are stripped from names.
- bill-365, 366 and 367 split one debate across two days with different sitting numbers and no repeated speeches.
- Sitting 14 Jan 1998: 93 attendance rows, 89 present, the same as SQL.
- Typos such as "k eeping" exist in SPRS too, so they are source OCR, not scraper errors.

Design decisions the personas met and correctly left alone:

- Parliament 15 has Memberships but no Reports.
- Presidents and Governors have non-member Memberships.
- The Assembly is shown as one Parliament 0 spanning three Assemblies.
- There are 18 weekend Sittings, including Sunday 13 Dec 1959.
- Search totals cap at 1,000.
- The API sort value is `date`, and the app maps "newest" to it.
- "Mr Deputy Speaker", "The Chairman", "An hon. Member" and "Hon. Members" are unlinked by design.
- Column numbers are stripped.

Not checked: CSV or JSON export (not built), speech search for "government" (avoided because of the known timeout), title-only matching on a text-less Report, and the sprs3 official record URL.

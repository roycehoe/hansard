# Data sanity personas, second pass: findings

17 Oct 2026

No high-severity regression. Every DS finding that was meant to ship is fixed on the stored data, no Report was lost, and the drop in linked speeches is the one the scraper's writes planned. The run did not stop early.

## Data state

- Remote database at Alembic `7c1d4e9a2b60`. The replica `hansard_replica` equals it; triage re-read the row counts on both: 1,050,712 speeches, 41,801 Reports, 135,083 attendance rows, 573 Persons, 1,438 Speakers.
- Figures from `scripts/attribution_text_share.py`, P0-11: ADR 0001 rate 98.09% (513,398 / 523,414), all-rows rate 84.20% (513,398 / 609,701), text share 97.15%.
- Shipped: writes #3, #4, #5 and #6, the fix run's G4, G5 and G6 writes (DS-03, DS-04, DS-07, DS-08, DS-10, DS-11, DS-12, DS-13, DS-16, DS-17) and DS-06.
- Not shipped: DS-14, the spelling write in scraper `75d193f` (Seet Ai Mee, Mohamad Maidin), the `transcript_tsv` migration (scraper `c4b6aa2`) and the attendance unique constraint (scraper `75c8719`, committed during this run). G3 (DS-05 and DS-09 census docs) did not ship.
- 120 Reports are held and keep kind NULL on 2,275 rows.

## How the run worked

Four Sonnet personas, a historian who also called the API as a data user, a Section 9A legal researcher, a journalist and a citizen, used the API on port 8001 and the app on 5174, both from a frozen copy of this repo at `da95cce`. They checked against read-only SQL and against SPRS through the JSON endpoints. Their condensed reports are in the run's scratchpad (`persona2/REPORTS.md`, notes per persona). Triage, on Opus, re-ran every DS repro and every persona finding against the replica and the API, read the cause in the scraper at `75c8719` (`services/speech.py` is unchanged since `5515de4`, the write #6 parser) and in this repo at `da95cce`, and counted the records with SQL. Triage made no SPRS request of its own. For the SPRS checks it read the raw HTML stored in `hansardwebsiteresponse` and the SPRS JSON the lawyer fetched today, and both agree.

Environment, not findings:
- The frozen copy's API allowed only the 5173 origin until about 11:42 (`api/main.py:22`, `allow_origins=["http://localhost:5173"]`), so pages on 5174 showed "Couldn't load". CORS for 5174 was added in the frozen copy only. Nothing is deployed, so this is not a production finding.
- This repo moved to `49ebfad` during the run. That commit searches `speech.transcript_tsv`, a column the remote does not have until the scraper's tsv migration ships. The personas did not test `49ebfad`.

No code was changed and nothing was written to any database.

## Summary

Confirmed: 0 high, 1 medium, 6 low. Owners of confirmed findings: scraper 6, app 1, api 0. Explained or rejected: 13 items, listed below.

| id | Title | Severity | Owner | Status | Relation to pass one | Records affected |
|---|---|---|---|---|---|---|
| DS2-01 | Unbolded member labels with a language note go to the previous speaker | medium | scraper | confirmed | new | 44 label rows in 19 Reports, with about 165 more paragraphs in the same turns |
| DS2-02 | Older-system dashes, quotes and accents are folded to ASCII | low | scraper | confirmed | new | 7,001 en dashes in 813 Reports, plus quotes and accents |
| DS2-03 | A joint label credits only the first minister | low | scraper | confirmed | new | 1 Report, 14 rows |
| DS2-04 | Adjacent italic tags split a word | low | scraper | confirmed | new | 5 words in 4 Reports |
| DS2-05 | "The Chairman" under "[Mr Speaker in the Chair]" stays unlinked | low | scraper | confirmed | DS-20, still present, not scheduled | 7 rows in bill-367 |
| DS2-06 | A footnote body keeps a bare number while its marker is bracketed | low | scraper | confirmed | new, follows from write #5's marker fix | 114 rows in 72 Reports |
| DS2-07 | Sitting pages show the stored attendance key, not the person's name | low | app | confirmed | new, DS-13 residue | 14,266 comma-form rows in 1,281 Sittings; 25 rows read as the wrong Devan Nair |

## Regression table, DS-01 to DS-20

| DS | Verdict | Triage evidence |
|---|---|---|
| DS-01 | fixed | `parseSpeakerLabel` from the frozen `app/src/lib/citation.ts`, run under Node on all 869 stored labels of the shape "The ... (...) (...)" (23,465 speeches), gives a person's name for every one. "The Minister for Trade and Industry (Trade) (Mr Lim Hng Kiang)" gives name "Mr Lim Hng Kiang", office "Minister for Trade and Industry (Trade)". |
| DS-02 | fixed | One Report has markdown and no rows: 22103, 292 characters of header. `GET /reports/00075644-WA.00073346-ZZ_1` returns `is_text_available: false`. The 1955 budget example now holds a HEADING and a PROCEDURAL row. |
| DS-03 | fixed | Speakers 359, 437, 522: Singapore Democratic Party; 615: Singapore People's Party; 714, 812: Singapore Democratic Alliance. |
| DS-04 | fixed | 0 duplicate `html_file_name` groups; 8 of the 18 listed ids remain, the 8 kept copies; stub 24905 stays by G4's design. A removed slug (`...19611130_S0005_T00052-motion`) opens the kept Report. The 2003-10-16 "martial arts instruction" search returns one Report. |
| DS-05 | changed, mostly fixed | The repro speech is now Lee Hsien Loong's (ordinal 197). Shapes on unlinked labels went from 174 / 36 / 229 at the pass one reconciliation to 31 / 2 / 39. The 31 "verb" rows are the italic question titles of annex 25158 ("_Pedra Branca (Question asked by Mr R Ravindran)_"), unlinked; the source names no speaker for that annex, so no one is credited wrongly. |
| DS-06 | fixed | 0 duplicated (sitting, speaker) pairs; 0 attendance names with `*`. |
| DS-07 | fixed | Sittings 5941, 5988 and 6009 hold 85, 79 and 94 rows; no Sitting has fewer than 20. The citizen matched all three against SPRS. |
| DS-08 | fixed | 0 Reports and 0 Sittings without a sitting number; 1 Sitting without a session number, 18 Mar 1986, as G4 recorded. |
| DS-09 | changed | Was not scheduled. 131 rows fell to 35: bracketed titled name 35, "Name (Mr Speaker)" 0, leading quote 0. The 35 are typos and broken brackets ("Mr Abdullah Tarmug", "Dr Goh Kong Swee", "Mr S. T. \)", "Encik Mohamad Maidin B P M (Marine Parade)"), A.V. Winslow and Andrew Fong, who have no Speaker row, and "The Chairman (Mr Tang)". |
| DS-10 | fixed | 141 location names, was 257; 0 used three times or fewer; 11 Memberships with more than one name, all seat moves per G5. |
| DS-11 | fixed | 0 repeated, 0 untrimmed, 0 with HTML. The lawyer's 8,423 rows where `title` differs from `original_title` are older transforms: 7,502 split a subtitle off and the rest join a newline or trim. |
| DS-12 | fixed | Flag true only in Parliament 0 (68) and 1 (55). |
| DS-13 | fixed | 0 comma-form canonical names. "Mrs Devan Nair" keeps the honorific by a recorded hand decision (register row "`person.canonical_name` changes on 90 of 573 persons"). 91 Persons now carry a variant. |
| DS-14 | unchanged, deferred | See the DS-14 section. Pass one called it not countable; it is: the stored markdown holds 11,407 language notes attached to a label, in 2,803 Reports. |
| DS-15 | fixed as designed | kind NULL on 2,275 rows in 120 Reports, all held; was 4,146. |
| DS-16 | fixed | 71 Speaker rows in Parliament 0. `GET /people?parliament_number=0` returns 123 Persons, `=1` returns 66. |
| DS-17 | fixed | One PAP string on 1,167 Speaker rows; `/parties` lists 20 values with one PAP. |
| DS-18 | unchanged, explained | bill-364: ordinal 3 "The Minister for Law (Mr K Shanmugam)", ordinal 6 "Mr K Shanmugam", as the Official Report prints. |
| DS-19 | unchanged, rejected | Persons 389 and 496 stay separate; two people per G5. |
| DS-20 | still present, not scheduled | bill-367 has 39 "The Chairman" rows, 32 linked to Charles Chong and 7 unlinked (ordinals 377, 379, 381, 383 to 386). Triage found the cause; it is DS2-05. |

No DS finding that was meant to ship is still present.

## Residual classes, brief decision 6

Counts are the cycle 4 counts (master `1220161`) and the stored counts now.

| Class | Count then | Count now | Verdict | Task and evidence | Severity if it hurts, fix direction |
|---|---|---|---|---|---|
| Italic titles stored as SPEECH | 9,782 rows / 1,094 Reports | Write #5 moved 9,696 rows to HEADING; about 120 linked italic-only rows in 13 Reports remain, most in held Reports 23268, 23627, 26696, 26471 | does not hurt | Lawyer counted a member's speeches in 22788: a slide caption adds 1 to a count. Journalist's all-caps title in 22879 is the same size. | |
| `<pre>` tables one row per line | 18,591 / 863 | not re-counted | does not hurt | Historian read Report 26958's table: every number is recoverable. Journalist found 78 table rows in written answer 28701 credited to the Minister. The tables are the minister's own written answer, so the attribution is right (`docs/vision.md:176`). They inflate a row count, and a row count was never a count of speeches. | |
| Prose cut inside `<pre>` | 1,021 rows | not re-counted | not reached | No persona read one. | |
| Footnote digits glued to a word | 1,462 hits | 987 rows hold a bracketed marker | does not hurt | Journalist quoted figures in 20463 and 20628: "$610[10]" and "2008 and 2010[9]" read correctly against SPRS. The footnote body keeps a bare "9", which is DS2-06. | |
| `****` column-marker cut | 770 / 293 | 17 / 11, all kind NULL in held Reports | does not hurt | Lawyer quoted passages for Section 9A and found them complete outside the held Reports. | |
| Labels that are not people | 113 / 15 | 33559 clean: Dr Tan Cheng Bock has 52 linked rows; annex 25158 keeps 31 rows under italic question titles | does not hurt | Historian, lawyer and citizen searched Tan Cheng Bock and found his speech attributed to him. | |
| Speech swallowed by a footnote run, "Table N:" caption | 6 rows in 23268; 2 lines | unchanged | Explained / not reached | 23268 is held, reason in `cycle4/held/HELD.md`. No persona met "Table N:". | |
| Reports with markdown and no rows | 702 | 1 (22103) | does not hurt | Citizen and journalist opened text-less and caption-only Reports. The 218 caption-only Reports are Explained, see CIT-4. | |
| Time stamps, near-misses, first readings, voting lines | 51, 29, 6 Reports, 9 | 5 voting lines and 2 time stamps linked outside held Reports; 114 more time-stamp rows in kind NULL held rows | does not hurt | Citizen read Person speech lists: a stray row moves a count by 1 or 2. Near-misses and first readings were not reached. | |
| The six held 22149-class Reports | 6 | 6 | Explained | Reasons in `cycle4/held/HELD.md`; 22149 itself is rebuilt and 286 of 288 rows are verbatim. | |
| `_SPEAKER_HONORIFIC_RE` gap | latent | latent | not tested | The brief excludes it. | |
| Unmatched attendance | 111 names | 3 rows: A.V. Winslow twice, Andrew Fong once | does not hurt | Citizen read attendance on 11 Sittings from 1955 to 2019: 0 unlinked, 0 duplicates. | |

No residual class hurts a task under the fixed line. The one wrong attribution the personas met, HIS-1, is not on the residual list; it is DS2-01.

## DS-14: does the missing language marker hurt a task?

Royce's ruling builds the language column only if the marker's absence hurts a task. The historian reported that it does, citing HIS-1. Triage's answer is no. HIS-1 is a separate label-detection defect, and the DS-14 column would not fix it.

What HIS-1 is. In 44 stored rows the transcript opens with another member's label, for example "Mr Chan Sun Wing (In Mandarin): I believe that if the Government...". Each row, and the paragraphs after it, is credited to whoever spoke before. In the source HTML these labels carry no `<b>` and no `<!-- Mr X -->` comment. Bolded labels with the same note, such as `<b>Mr Wong Soon Fong (Toa Payoh)</b>(<i>In Mandarin</i>):` in the same Report, parse correctly and lose the note as DS-14 describes. So the language note is not what breaks detection. The missing bold is. The note is still in these 44 rows, because the parser never read the line as a label.

The cause in `services/speech.py`:
- `:885-913`. A line with no `**` goes to the plain-line branch. There, `_PLAIN_ROLE_LABEL_RE` (`:262-266`) is the only label test, and it accepts only an office label that starts with "The" and holds a bracketed honorific name. The NOTE at `:261` says a bare name label such as "Mr Tan:" is left out on purpose, because quoted lines inside a speech look the same.
- `:913`. The line becomes `_build_line_speech(parsed_line, current_speaker)`, the previous speaker's row.
- `:1051-1053`. The final strip of `_LANGUAGE_NOTE_RE` only matches at the start of a transcript, so the note inside "Mr Chan Sun Wing (In Mandarin):" survives.

The count. 44 label rows in 19 Reports, 1961 to 2003. 26 of them are in 1962 alone.
- 38 are bare-name labels in 13 Reports, none held.
- 2 are office labels the role regex cannot read: "The Prime Minister (In Mandarin):" in 38500, and a stray bracket in 30903.
- 4 are office labels in held Reports 30421, 26909, 26696 and 26471. The P2 fix `971676b` already reads that shape, so a rebuild of those Reports would fix them.
- 39 of the 44 label rows are linked to the wrong member, 20 of them to Mr Speaker. The other 5 sit under "The Chairman", "An hon. Member" or no speaker.
- The turns they open run on in the markdown for about 165 more paragraphs, about 120,000 characters across the 19 Reports, and those paragraphs carry the same wrong credit. Example, Report 38830, 19 Mar 1962: ordinals 361 to 374 hold speeches by Chan Sun Wing and Tan Cheng Tong of the Barisan Sosialis, all credited to Mr Speaker (George Oehlers).

The same unbolded bare-name shape without a language note exists too. A crude regex finds 89 rows in 47 Reports ("Mrs Seow Peck Leng: ..." under "An hon. Member", "Mr Speaker: Clarifications?" under a minister). Triage did not read them and some will be quotes, which is why the NOTE at `:261` holds back.

What a minimal fix changes, with no language column. Accept an unbolded line as a label when it opens with an honorific and a name, takes an optional constituency bracket, and ends in a language note and a colon. Add it as a second pattern beside `_PLAIN_ROLE_LABEL_RE` at `:898`, and let "The ... (In X):" through without a name bracket. The language note is what makes this safe: a quoted "Mr Tan:" never carries "(In Mandarin):". Effect: 40 label rows and their continuation paragraphs in 15 Reports go to the right member, after a re-parse of those 15 and a stage 8 run. Ordinals stay, because each label line is already its own row. The 4 held rows wait for their Reports to be released. As a side effect, `_LANGUAGE_NOTE_RE.sub` at `:900` then strips 44 more notes, so the register row "A language note ('(In Mandarin):') is stripped..." needs its cost updated.

What the full DS-14 column changes. Add a `speech.language` column: a scraper migration, the API schemas and the app label. Keep the note that `_LANGUAGE_NOTE_RE` now discards at `:900`, `:932` and `:1052`, and re-parse about 2,800 Reports so that 11,407 label notes (9,180 in 2,097 older-system Reports, 2,227 in 706 newer-system Reports) are stored and shown. The register row changes from a loss to a kept field. On its own it fixes none of the 44 rows, because the parser never reaches them as labels. With the minimal fix in place as well, those rows would get both the right speaker and a language.

Does the absence itself hurt a task? No persona got a wrong figure, a wrong attribution or a missing passage from it. The English text is the Official Report's own translation, and it is stored in full. A Section 9A researcher loses the flag that the words are a translation, which is worth having but is a low defect under the fixed line. Triage's call: the minimal fix should go ahead as a medium fix on its own merits (DS2-01), and DS-14 stays deferred.

## Findings: scraper

### DS2-01. Unbolded member labels with a language note go to the previous speaker

- Severity: medium. Owner: scraper. Status: confirmed. Personas: historian (HIS-1).
- Relation to pass one: new. It belongs to the open class "unbolded speaker labels" in `docs/vision.md:176`, item 3, which is not on the cycle 4 residual list and has no register row.
- App URL: http://localhost:5174/reports/00069066-ZZ.00051064-ZZ_1%23id006_19620319_S0003_T00032-motion#s361 (Report 38830, 19 Mar 1962).
- API call: `GET /reports/00069066-ZZ.00051064-ZZ_1%23id006_19620319_S0003_T00032-motion`, ordinal 361: `transcript` opens with the label and `person_name` is George Oehlers.
- Expected: "Mr Chan Sun Wing (In Mandarin): ..." starts a row credited to Chan Sun Wing.
- Actual: the row and the turn after it are credited to Mr Speaker, George Oehlers.
- How expected was established: the stored raw HTML, which SPRS serves, prints the label at the start of a paragraph with no bold. The note "(In Mandarin)" is what the Official Report prints before an interpreted speech.
- Repro:
  ```sql
  select s.report_id, s.ordinal, s.speaker, s.speaker_id, left(s.transcript, 80)
  from speech s
  where s.transcript ~ '^(Mr|Mrs|Madam|Mdm|Miss|Dr|Inche|Encik|Che|The|Tuan|Haji|Maj|BG)\s[^:]{0,200}?\(\s*[Ii]n (Malay|Mandarin|Tamil|Hokkien|Chinese|Teochew|Cantonese)\s*\)_?\s*:'
  order by s.report_id, s.ordinal;
  -- 44 rows, 19 Reports, 39 linked
  ```
- Suspected cause: `services/speech.py:885-913` with `_PLAIN_ROLE_LABEL_RE` at `:262-266` and the NOTE at `:261`; full reasoning in the DS-14 section.
- Fix direction: the minimal fix in the DS-14 section, with a golden fixture taken from Report 38830, then re-parse the 15 Reports that are not held and run stage 8. Size the 89-row unbolded shape without a note by reading it before writing any rule for it.
- Records affected: 44 label rows in 19 Reports (40 rows in 15 Reports not held), about 165 continuation paragraphs, about 120,000 characters. Examples by speech id: 688388 (38830, Chan Sun Wing under Mr Speaker), 787800 (38691, Madam Chan Choy Siong under Mr Speaker), 841830 (37959, Mr S. Rajoo under Jek Yeun Thong), 808536 (24951, Ong Ah Heng under Dr Tan Cheng Bock), 857584 (39039, Ong Chang Sam under Mr Bani).

### DS2-02. Older-system dashes, quotes and accents are folded to ASCII

- Severity: low; medium for anyone quoting text exactly. Owner: scraper. Status: confirmed. Personas: journalist (JOU-1), lawyer (LAW-1).
- Relation to pass one: new. No register row covers it.
- API call: `GET /reports/{slug}` for Report 22149 (Budget 2009), ordinal 22.
- Expected: "last year – or by 5.4%", as SPRS prints it.
- Actual: "last year - or by 5.4%".
- How expected was established: the SPRS `getHansardTopic` JSON for `023_20090122_S0004_T0001`, fetched by the lawyer today, holds `&ndash;` 38 times, and the stored raw HTML is the same.
- Repro:
  ```bash
  curl -s -X POST -H 'Content-Type: application/json' -d '{"id":"023_20090122_S0004_T0001"}' https://sprs.parl.gov.sg/search/getHansardTopic
  ```
  ```sql
  select count(*) filter (where h.content like '%&ndash;%'),
         sum((length(h.content) - length(replace(h.content, '&ndash;', ''))) / 7) filter (where h.content like '%&ndash;%')
  from hansardwebsiteresponse h join report r on r.report_id = h.report_id where r.report_version = 'sprs2';
  -- 813 Reports, 7,001 entities
  ```
- Suspected cause: `utils/markdown_parser.py:424`, `html2text.HTML2Text(bodywidth=0)` with `unicode_snob` left off. html2text then writes every named entity in its `UNIFIABLE` table as ASCII: `ndash` to "-", `mdash` to "--", `rsquo`, `lsquo`, `ldquo` and `rdquo` to straight quotes, and accented letters to bare ones (`HELD.md` notes "Cafe" for "Caf&eacute;" in 22149). A literal U+2013 in the HTML survives, which is why the journalist found en dashes in 2011 and 2012 text. Sittings use the same converter at `:525`.
- Fix direction: set `converter.unicode_snob = True` for report markdown, check the effect with the fidelity loop's detectors, re-parse the affected older-system Reports, and add a register row. The comparison script in the first findings file folds curly quotes anyway, so only dashes and accents change what a reader sees.
- Records affected: 7,001 en dashes in 813 Reports; 8 em dashes in 6 Reports became "--"; `&rsquo;` in 784 Reports, `&ldquo;` in 113, `&lsquo;` in 27; accented letters in 30. Examples: 22149 ordinal 22.

### DS2-03. A joint label credits only the first minister

- Severity: low. Owner: scraper. Status: confirmed. Personas: journalist (JOU-3), lawyer (LAW-4).
- Relation to pass one: new.
- App URL: http://localhost:5174/reports/president-address-256#s1
- API call: `GET /reports/president-address-256`, speech 1.
- Expected: the addendum credited to Mr Lim Hng Kiang and Mr S Iswaran, as the markdown prints both bold labels.
- Actual: `speaker_label` "The Minister for Trade and Industry (Trade) (Mr Lim Hng Kiang)", and the transcript opens "and The Minister for Trade and Industry (Industry) (Mr S Iswaran) : MTI aims...". All 14 rows go to Lim Hng Kiang.
- How expected was established: stored markdown of Report 44184, which reads `**...(Mr Lim Hng Kiang)** and **...(Mr S Iswaran)** :`.
- Repro:
  ```sql
  select report_id, ordinal, left(transcript, 90) from speech where transcript ~ '^and (The|Mr|Mrs|Ms|Dr) [^:]{0,200}\) ?:';
  -- 1 row, Report 44184
  ```
- Suspected cause: `_BOLD_RUN_RE` at `services/speech.py:312` joins bold runs only across whitespace, so " and " ends the label. `:924` puts the rest of the line, second name included, into the transcript.
- Fix direction: treat "**A** and **B** :" as one joint label. One Report has the shape, so a hand entry may be cheaper than a rule. Iswaran's speech count is short by these rows.
- Records affected: 1 Report, 14 rows.

### DS2-04. Adjacent italic tags split a word

- Severity: low. Owner: scraper. Status: confirmed. Personas: lawyer (LAW-2).
- Relation to pass one: new. Pass one's coverage section said "k eeping" exists in SPRS too. That was wrong: SPRS holds `k</I><I>eeping`, which a browser shows as one word.
- API call: `GET /reports/{slug}` for Report 22788 (Penal Code (Amendment) Bill, 22 Oct 2007), ordinal 9.
- Expected: "keeping pace with technology".
- Actual: "k_ _eeping pace", rendered "k eeping".
- How expected was established: SPRS JSON for 22788 and the stored raw HTML, both `- k</I><I>eeping pace`.
- Repro:
  ```sql
  select s.report_id, s.ordinal, substring(s.transcript from '.{12}[a-z]_ _[a-z].{8}')
  from speech s
  where s.report_id in (21967, 22645, 22788, 43443) and s.transcript ~ '[a-z]_ _[a-z]';
  ```
- Suspected cause: html2text closes and reopens the emphasis, and `utils/markdown_parser.py` does not merge adjacent same-name tags before the converter runs (`get_cleaned_report_markdown`, `:420-430`).
- Fix direction: merge `</i><i>` and `</b><b>` in `_preprocess_html` before conversion.
- Records affected: 5 split words in 4 Reports: 22788 "k_ _eeping", 22645 "_h_ _ongbao_" twice, 21967 "_x_ _ue", 43443 "t_ _argeting". 8 older-system raw Reports hold the tag shape.

### DS2-05. "The Chairman" under "[Mr Speaker in the Chair]" stays unlinked

- Severity: low. Owner: scraper. Status: confirmed. Personas: lawyer (LAW-3).
- Relation to pass one: DS-20. Pass one left it unconfirmed and in no group, so this is not a regression.
- App URL: http://localhost:5174/reports/bill-367#s377
- API call: `GET /reports/bill-367`, ordinals 377, 379, 381 and 383 to 386.
- Expected: linked to the Speaker, Tan Chuan-Jin. The source puts `**[Mr Speaker in the Chair]**` right before "**The Chairman** : Clerk, ring the Division bells." The 32 linked rows follow "[Deputy Speaker (Mr Charles Chong) in the Chair]" and are right.
- Actual: unlinked, `person_name` empty. No row is linked to the wrong person.
- How expected was established: stored markdown of Report 12651, lines 383 and 396, and `utils/speaker_terms.py:14` (Tan Chuan-Jin, 11 Sep 2017 to 17 Jul 2023).
- Repro:
  ```bash
  curl -s localhost:8001/reports/bill-367 | python3 -c "import json,sys;sp=json.load(sys.stdin)['speeches'];print([(s['ordinal'],s['person_name']) for s in sp if s['speaker_label']=='The Chairman' and not s['person_id']])"
  ```
- Suspected cause: `services/role_context.py:114-116`. A "Mr Speaker" annotation links "The Chairman" only when the report header names one Speaker and a chair-change line follows. Newer-system Reports have no "MPs Speaking" header, so `_get_header_holders` returns nothing.
- Fix direction: when the annotation is "Mr Speaker" or "Mdm Speaker" and the header gives no holder, take the holder from `SPEAKER_TERMS` by sitting date. Stage 7 and stage 8 already use that table.
- Records affected: 7 rows in bill-367. The corpus count of this shape was not measured; "The Chairman" leaves 4,018 newer-system rows unlinked overall (`docs/vision.md:148`), most with no chair named.

### DS2-06. A footnote body keeps a bare number while its marker is bracketed

- Severity: low; style. Owner: scraper. Status: confirmed. Personas: journalist.
- Relation to pass one: new. It follows from write #5's footnote marker fix.
- API call: `GET /reports/{slug}` for Report 20628, ordinals 2 and 3.
- Expected: the body marker "2010[9]" and the footnote row in matching form, for example "[9] Past employment records...".
- Actual: the footnote row (EDITORIAL_NOTE) reads "9 Past employment records were not captured...".
- How expected was established: SPRS JSON for 20628 and the register row "A superscript footnote number glued to the text before it is written as a bracketed marker".
- Repro:
  ```sql
  select count(*), count(distinct report_id) from speech where kind = 'EDITORIAL_NOTE' and transcript ~ '^\d{1,2} [A-Z]';
  -- 114, 72
  ```
- Suspected cause: the marker fix brackets `<sup>` digits glued to text, and the footnote's own leading number is not a glued superscript.
- Fix direction: bracket the leading number of a row in the footnote run the same way, or leave it and say so in the register row.
- Records affected: 114 rows in 72 Reports.

## Findings: app

### DS2-07. Sitting pages show the stored attendance key, not the person's name

- Severity: low. Owner: app. Status: confirmed. Personas: citizen (CIT-3, and CIT-1 in part).
- Relation to pass one: new, DS-13 residue. Write #6 set 400 attendance rows to the Speaker-row form ("K.M. Byrne" became "Byrne, K.M."), by Royce's ruling.
- App URLs: http://localhost:5174/sittings/1996-12-02, http://localhost:5174/sittings/1964-11-13
- API call: `GET /sittings/1996-12-02`, `attendance[]` holds `name` "Chandra Das, S." and `person_name` "S. Chandra Das".
- Expected: the name a reader knows the member by, as the person pages show it. The source prints "Mr S. Chandra Das (Cheng San GRC)".
- Actual: the list mixes "Chen Seow Phun, John, Dr" and "Beng Kian Lam, Arthur" with "Ahmad Mattar". On 13 and 16 Nov 1964 it shows "C.V. Devan Nair, Moulmein". The link goes to Person 567 Mrs Devan Nair, which is right, but the text names her husband, who was not a Singapore member then. The source prints "Mrs C. V. Devan Nair (Moulmein)".
- How expected was established: the API response, the stored sitting markdown, and the register row "`attendance.speaker_name` changes on 496 rows", which makes the stored name a stage 7 matching form.
- Repro:
  ```sql
  select count(*), count(distinct speaker_name), count(distinct sitting_id) from attendance where speaker_name like '%,%';
  -- 14,266, 90, 1,281
  ```
- Suspected cause: `app/src/components/sittings/ListAttendance.tsx:39` and `:42` render `member.name`. The API also orders the list by the stored name (`api/crud/attendance.py:44`), so comma forms sort by surname and the rest by given name.
- Fix direction: show `person_name` when `person_id` is set and keep `name` for unlinked rows; sort the same way in the API. The stored data is as Royce ruled, so the scraper needs no change.
- Records affected: 14,266 comma-form rows in 90 spellings and 1,281 Sittings. 14,912 linked rows differ from the Person's canonical name. 25 rows of Mrs Devan Nair read "Devan Nair" (23) or "C.V. Devan Nair" (2).

## Explained and rejected

- CIT-1, Mrs Devan Nair, rejected as a misattribution. All 77 attendance rows and 27 speeches belong to Mrs Devan Nair, member for Moulmein. The source prints "Mrs Devan Nair (Moulmein)" and "Mrs C. V. Devan Nair (Moulmein)" in the lists of 1963 and 1964. Her canonical name keeps the honorific by a recorded hand decision. The stored name losing "Mrs" is part of DS2-07.
- CIT-4, 218 Reports holding one caption row, Explained. The source holds only a link to a separate table file (31576: `<a href=".../19870304-HA-0490103.htm">Table - UNSOLD HDB FLATS ...</a>`). The register rows "Link URLs are dropped from report markdown" and "A report with markdown whose parse gives no row keeps one row per paragraph" cover it. The official-record link on the page reaches the table. A note on the page would help, but no text is missing from the source.
- JOU-4, "Lim Chin Siong" finds no Person, Explained. The Official Report prints "Lim Ching Siong" in 91 labels and 398 transcripts, and "Lim Chin Siong" in 0 labels and 50 transcripts. The name comes from `data/colonial_la_members.json:18`, in line with Royce's rule to follow the Official Report. A search alias is a feature, the `name_variants` work DS-13 left out.
- JOU-5 and LAW-5, the 35 unlinked bracketed names. This is the DS-09 remainder, recorded in the regression table.
- LAW-3 is merged into DS2-05.
- HIS-2 and JOU-2, `<pre>` table rows credited to the minister, are not findings. The residual class does not hurt; see the residual table.
- CIT-2, 7 stray SPEECH rows (speech ids 268792, 854849, 859439, 992273, 992313 "The voting was as follows:-" under Mr Speaker; 651329 "7.50 p.m. ."; 1026087 "26.09"), are confirmed in the data and do not hurt. They are recorded under the residual class.
- The historian's verdict that DS-14 hurts a task is rejected; the harm is DS2-01. See the DS-14 section.
- `/coverage` `linked_speech_count` fell from 961,901 in pass one to 934,585. This is not mass unlinking. Every linked row now has kind SPEECH, apart from 1,802 rows in held Reports. Writes #3 to #5 took rows that no member spoke off speakers by design, for example 9,461 italic titles in write #5, and `docs/vision.md:79-89` records each step with its figures.
- The brief's search kind filter does not exist and never did. No commit in this repo's history adds a kind parameter to `/search/speeches`. `16593bd` "add speech kind to the report and search speech types" adds `kind` to the TypeScript response types, and the brief read "speech types" as a filter. Pass one's DS-15 already said "The search API has no kind filter." The persona check of the kind filter was therefore not testable; the rendered kinds were checked instead (Coverage).
- The known gap "no Report text after 13 Aug 2012" in brief decision 8 is stale, for the second time. `/coverage` gives text from 22 Apr 1955 to 8 Apr 2025 and `text_report_count` 41,675 of 41,801. Every year from 2013 to 2025 has text in all but 5 to 13 of its Reports. Pass one's "Known-gap reconciliation" recorded the same fact.
- The lawyer's SPRS misses: 38580 has 4 rows cut at "[Interruption]" or "[Pause]", which the register records. 22149 has 2 rows that differ by "S &CC" against "S&CC" and the en dash, which is DS2-02.
- Report 24905, the 16 Oct 2003 stub with a 1003 year, stays by G4's design. It has no twin.

## Coverage: what was checked and looked right

Triage re-ran:
- Every DS repro in the first findings file, on the replica and through the API.
- Node runs of the frozen `citation.ts` over 869 office labels.
- SQL counts for every persona finding.
- The stored raw HTML for 38830, 31576, 22149, 22788 and 12651.

From the personas, checked by triage where marked:
- Person speech counts equal search by person and Parliament wherever search is not capped: Tan Cheng Bock P5 346, P8 620; Chiam See Tong P9 979, P10 761 (triage re-ran P10), P11 249; Rajaratnam P2 516; Lee Kuan Yew P5 486. Search caps at 1,000 with `is_total_capped`.
- Rendered kinds: bill-367 has 442 SPEECH rows and 442 citation buttons. In 22149, HEADING renders as h3, notes are muted, and a run continues across an EDITORIAL_NOTE with "..., continued:". In 38580 a run continues across "[Interruption]".
- Old slugs `/people/47-rajaratnam-s` and `/people/99-old-wrong-slug` resolve by id in the app. The API takes integer ids only.
- Pre-1990 sitting and session numbers match SPRS on 27 Jan 1970, 7 Jun 1956 and 22 Feb 1990. Report and Sitting agree on all 41,801 Reports.
- The 150 inserted attendance rows match SPRS. The write #6 name "Byrne, K.M." links 147 rows to Person 503. 34 name and Speaker pairs differ, and each shares a token with its link.
- SPRS speech-by-speech re-comparison of pass one's 5 Reports: 38580 564 rows, 28223 358, 30039 207, 22788 498, 42164 29, and 33559 238. Every row is verbatim except the items listed above. The citizen compared written-answer-2396 of 3 Mar 2015 and found it verbatim apart from a dropped "Page: 129".

Not checked: prose cut inside `<pre>`, procedural near-misses, first readings left credited, the "Table N:" caption, the clipboard text of a copied citation (checked through the code only), and `49ebfad`.

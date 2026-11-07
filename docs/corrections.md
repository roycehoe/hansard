# Corrections

Errors found in the archive, by an audit or by a reader's report, and the fix for each.

## Reporting an error

- Email royceinbox@hotmail.com. The "Report an error" action on each paragraph opens an email with that speech's link filled in. Each Report page also has a "Report a problem with this report" link.
- Or open a public issue with the [Report an error form](https://github.com/roycehoe/hansard/issues/new?template=report-an-error.yml).

## What happens next

I'm Royce, and I run the site on my own. When the archive gets a speech's words or its speaker wrong, I fix it and add a row to the log below. If Parliament asks me to take a report down, I do it within 2 working days and don't ask for a reason.

Fixes to the stored text or credits go into [roycehoe/hansard-scraper](https://github.com/roycehoe/hansard-scraper), which owns the database. This site only reads it.

## Log

Each fix gets a row here, newest first. The Found by column says whether an audit of the data or a reader's report found the error; a dash in Reported means the fix came from an audit. The first rows are the credit changes the scraper stored on 17 and 18 October 2026, in writes #7 to #9. Each has a fuller row in the scraper's [data-loss register](https://github.com/roycehoe/hansard-scraper/blob/master/docs/data-loss-register.md).

| Reported | Fixed | Found by | Report | What was wrong | What changed |
| --- | --- | --- | --- | --- | --- |
| — | 6 November 2026 | Audit | 8 person pages | Eight elected members' names did not follow the Elections Department's spelling. Seven came from Parliament's member list (Koo Yong, Lai Tai Chai, Zulkifli Bin Mohamed, Ahmad Khalis bin Abdul Gahni, Abdul Nasser Bin Kamarudin, Chew Chin Harn) or from the Assembly's speech labels (Baharuddin Bin Mohamed Ariff). The eighth was Lim Chin Siong, a spelling I had set by hand on 6 November. | The eight now read Koo Young, Lai Tha Chai, Zulkifli Bin Mohammed, Ahmad Khalis bin Abdul Ghani, Abdul Nasser Bin Kamaruddin, Chew Chin Han, Baharudin Bin Mohamed Ariff and Lim Ching Siong. Each person's page lists the other spelling and who prints it, and the old page address still works. The text of the record is unchanged. |
| — | 18 October 2026 | Audit | 60 older-system reports | The stored rows credited headings, footnotes, division-list rows, procedural lines and amendment texts to a member or the chair. Table rows that stood under a caption were left under the caption's label. | Write #9 read the 60 reports again and changed 318 rows in speaker or text. 107 rows lost the speaker they were credited to, 72 rows gained a link and 47 linked rows were deleted because the parse joins them into the row next to them. 17 glued words were split. |
| — | 18 October 2026 | Audit | 3 reports in Parliament 14, 180 reports in Parliaments 12 to 14, and 4 reports with a direction | A chair call such as "Mr Speaker: Mr Louis Chua." was credited to the member who spoke before it. Separately, a written question's lead-in, such as "The following question stood in the name of Ms Poh Li San", was credited to the member as speech, and so were 5 bracketed "Hon Members" directions. | Write #8 credited the 3 chair calls to the presiding officer, Seah Kian Peng for report 2741 and Tan Chuan-Jin for 10745 and 45745. It also took the speaker and link off the 180 lead-ins and made the 5 directions rows of their own with no speaker. The question text of 115 lead-ins moved to a new row credited to the same member. |
| — | 17 October 2026 | Audit | 14 reports | A speaker label that carries a language note, such as "Mr Chan Sun Wing (Upper Serangoon) (In Mandarin):", was read as text. The member's words were credited to whoever spoke before, most often Mr Speaker. | Write #7 changed the speaker on 133 rows: 36 label rows and the 97 rows after them. 59 of the 133 had been credited to Mr Speaker. 132 now link to the member the label names. "Inche Rahamat" in report 38006 stays unlinked. |

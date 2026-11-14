# Writing guide

This guide is for anyone who writes or rewrites text on openhansard.sg. Royce owns the site, and every principle here comes from a comment he made on a draft. Each principle gives the instruction, quotes his comment with its date, and shows a passage before and after the change he asked for. A rule marked (inferred) rests on a pattern in drafts he approved, not on words he wrote.

Work in this order. Find the page's reader, apply the nine principles, apply the mechanics, then run the checklist at the end on every page you change.

## What you must not change

- Keep every fact, figure, date, name, and link target. Don't add a claim that the text you were given doesn't already make. When rule 3 or rule 9 asks for a who, a when, or a scope that the text doesn't state, don't supply it from memory. List the question in your reply instead.
- Keep Parliament's own words exactly as the record prints them, including any quote from a debate.
- Keep these words as they are, because each one names something specific: the archive's terms (Person, Membership, Speaker label, Presiding officer, Report, Sitting, Paragraph), the labels in the header and footer, and the names of each era, such as Legislative Assembly and Yang di-Pertuan Negara. A count of paragraphs stays "paragraphs" and never becomes "speeches".
- Leave the Chinese, Malay, and Tamil paragraphs on Coverage untouched.
- Keep every `{...}` placeholder in the text. Text inside a condition such as `{CONTACT_EMAIL && (...)}` is hidden when the value is empty, so the sentences around it must still read without it.
- On Home and About, you may cut words but add no new sentence. Royce wants both pages minimal: "I like the minimalism of our current website. This adds more stuff to our front page which I am quite opposed to." (14 Nov 2026)
- Keep URLs, section anchors, and layout. You change words only.
- If you cut a fact from a page, list it in your reply with the page it belongs on, usually Data quality and methods, so it can move there instead of being lost.

## Who reads each page

Royce named these readers on 14 Nov 2026.

| Reader                                     | Pages                                                                                                                                                                                                                                   | What they already know                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Someone who knows nothing about Parliament | Home `/`, How Parliament works `/how-parliament-works`, About `/about`, Policies `/about/policies`, Coverage `/coverage`                                                                                                                | Nothing. They don't know what an MP, a Bill, a sitting, or the Hansard is.                                 |
| A researcher or journalist                 | Data quality and methods `/coverage/methods`, For researchers `/researchers`                                                                                                                                                            | How Parliament works. They want to know how the archive was made, how far to trust it, and how to cite it. |
| Anyone at all                              | Interface text on every page: the header, footer, buttons, labels, notices, tooltips, empty and error states, and `aria-label` values. That includes the record pages under `/search`, `/sittings`, `/people`, `/acts`, and `/reports`. | Anything from nothing to everything. Write so a newcomer can follow and an expert isn't slowed down.       |

Policies holds the long text that was on About until 14 Nov 2026, so it keeps About's reader.

Interface text also follows the Copy section of `app/STYLE.md`, and a brief for interface text pastes that section in with this guide. Principles 3, 5, and 7 apply to page prose only. A label such as "Link copied" or "Couldn't load the speeches" needs no named actor.

<!-- pending ruling: Royce hasn't named a reader for /palette, /design or docs/corrections.md. Recommendation: leave /palette (a colour specimen page) and /design out of the refine run. In docs/corrections.md, refine only the prose sections, for a lay reader, and leave the rows of the log as records. -->

### Explanatory pages

About, Policies, How Parliament works, Data quality and methods, For researchers, and `docs/corrections.md` are the explanatory pages. They are prose that Royce writes to the reader. Their job is to explain and to make promises a person stands behind, so the rules under Voice apply to them and to no other page. Home and Coverage are mostly links and counts, so they follow the interface text rules on first person.

## Principles

### 1. Answer the question first

The first sentence under a heading answers the heading's question. Background, history, and examples come after it, or not at all. Keep the opening of a page short, and put an example in the section it illustrates.

> "What does parliament do?" (14 Nov 2026, on a draft that opened "Singapore's Parliament has one House")

> "people don't care. What is hansard? Give a direct answer" (14 Nov 2026)

> "This can be introduced later. Keep the intro short" (14 Nov 2026, on an opening paragraph about the page's running example)

- Before: "Hansard is the name many parliaments give their written record of what is said in the House, and in Singapore that record is called the Official Report."
- After: "The Hansard is the official written record of Parliament's debates. In Singapore, it is called the Official Report."

### 2. Define a term the first time, or use a plain word

On a page for someone who knows nothing about Parliament, assume the reader has never met any word that belongs to Parliament, to the law, or to the archive. A researcher knows Parliament's words but not the archive's. Where such a word first appears, explain it in that sentence or the next, or replace it with a plain word. A vaguer phrase put in its place is still a new term. So are a short name ("the Council") and a mark on the screen (a small i). The Terms section under Mechanics says which pages define and which use a plain word.

> "If I have no idea what a "House" is, this would be confusing" (14 Nov 2026)

> "What is a rule? What is a regulation? A reader who encounters these terms for the first time will get confused. Either avoid these words by explaining it simpler, or define these words" (14 Nov 2026)

> "New term here. Confusing to what this means, or how it relates to anything" (14 Nov 2026, on "Legal requirements", the next draft's stand-in for "rules")

- Before: "Rules such as regulations can also be made under an Act. These are called subsidiary legislation and must be presented to Parliament."
- After: "An Act often sets out the main law and leaves some details to be filled in later, without passing a new Act. These details are called subsidiary legislation."
- Before: "Some receive oral answers at Question Time, when MPs can ask follow-up questions."
- After: "Question Time is the period at the start of most sittings when Ministers answer questions aloud and MPs can ask follow-up questions."

### 3. Answer the next question

After each sentence, ask what this page's reader would ask next. Usually it is who does this, when, where, or what makes it happen. Answer it in the text when the text you were given already holds the answer. When it doesn't, list the question in your reply and don't make up the answer. Every sentence names who acts. Words such as "some", "others", "it", and "the authority" don't tell the reader who.

> "Who is some? MPs? Ministers? Some other party?" (14 Nov 2026)

> "when?" (14 Nov 2026, on "Each year, the Minister for Finance presents the Budget")

> "Who writes the subsidiary legislation? What if people disagree with it? How does subsidiary legislation become law?" (14 Nov 2026)

> "When you say "may also make statements", what prompts these?" (14 Nov 2026)

- Before: "Each year, the Minister for Finance presents the Budget."
- After: "The Minister for Finance usually presents the annual Budget in February, before the financial year begins on 1 April."
- Before: "The authority named in the Act makes the subsidiary legislation."
- After: "Ministers and government agencies make subsidiary legislation using powers given to them by an Act."

Answer only what this reader would ask. Rule 4 cuts the rest.

### 4. Cut what the reader doesn't need or can work out

Ask two things of every sentence. Would this page's reader miss it if it went? Could they work it out from what the page already says? If they wouldn't miss it, or could work it out, cut it. On a lay page, cut detail that would go over a newcomer's head, and list the fact for Data quality and methods. A block so long that nobody will read it gets cut until someone will.

> "so what?" (14 Nov 2026, on a sentence about how the record prints each speech)

> "If there is too much detail that would fly over most people's heads, drop it." (7 Nov 2026, on About's accuracy section)

> "" It is the authoritative text." Would this be implied making this statement redundant?" (14 Nov 2026)

> "If no one is going to read it because it is a hunk of text, then we keep this page minimal" (14 Nov 2026, on About)

He made the same mark on another product, AutomationHub, on 4 Nov 2026: "This is all very obvious stuff. Remove."

- Before: "This is not an official Parliament site. If you're quoting a debate in print or citing it in a court document, use the Official Report on Parliament's website because it is the authoritative text. Report pages here link to Parliament's copy of the same report so you can check it."
- After: "This is not an official Parliament site. When quoting or citing a debate, use Parliament's Official Report."

The same test applies to labels. "Official record, on Parliament's site (opens in a new tab)" became "Official Report", because "Parliament's site is implied" (14 Nov 2026). Keep "(opens in a new tab)" as hidden screen-reader text, because a link that opens a new tab must say so in its accessible name.

### 5. Say how many, then mark each item and the end

When a section covers several kinds of a thing or several ways to do something, say how many before the first one. When paragraphs make up a complete set that the section has announced, open each with "First," "Second," and so on, and give every item its marker. When a page already ends on a summary, open that sentence with a word that says so, such as "In all,". Don't add a summary the page doesn't have.

> "Start by declaring that there are 3 types of MPs. This creates a mental model for readers for what will be covered in this section, making the rest easier to read" (14 Nov 2026)

> "Are these two paragraphs the same point? If not, the second paragraph should get a "Secondly"." (14 Nov 2026)

> "This ends too awkwardly. Do something like "In all" or "in summary"" (14 Nov 2026)

- Before: "Most MPs are elected at a general election, either alone for a Single Member Constituency (SMC) or [...] Since 1984 the losing opposition candidates [...] And since 1990 the President has appointed Nominated MPs [...]"
- After: "There are three types of MP:" followed by one bullet each for elected MPs, NCMPs, and NMPs.
- Before: "MPs ask Ministers questions about the Government's work. [...] A ministerial statement explains a Government policy or decision."
- After: "MPs can hold the Government to account through questions and motions. First, MPs ask Ministers questions about the Government's work. [...] Second, MPs can propose motions for Parliament to decide on."

### 6. Give parallel things the same shape

When two sentences, paragraphs, or labels do the same job, write them the same way, with the same kind of subject, the same opening, and the same order. A reader who has read the first can then predict the second.

> "Follow how the first paragraph of this section is written to reduce cognitive load" (14 Nov 2026)

> "It should follow the same structure as the "In November 2019, for example, one MP asked" Paragraph. Again, this reduces cognitive load when reading because of predictability in explanation" (14 Nov 2026)

> "Given that everything else is one word, this should fit that convention" (14 Nov 2026, on the page name "How I run the site", which became "Policies")

- Before, with the example folded into the explaining paragraph: "...MPs can ask for clarification but cannot debate it. After the statement on personal mobility devices in August 2019, MPs asked whether more could be done about fires involving the devices..."
- After, as its own paragraph shaped like the question example before it: "In August 2019, for example, a ministerial statement announced an earlier deadline for personal mobility devices to meet a fire and electrical safety standard. MPs then asked whether more could be done about fires involving the devices, and whether shops selling devices that failed the safety standard could be punished more heavily."

On How Parliament works the shape is a paragraph that explains, then a paragraph that opens "In <month> <year>, for example," with one real case.

### 7. Show one real example, briefly, linked to the record

Explain the idea in your own words first. Then give one real case in one or two sentences that say what was asked, announced, or decided, and link those words to the exact speech or report. Don't quote at length, don't retell the debate, and don't make the example do the explaining. Pick an example that can't read as a point scored for or against any party.

> "We are leaning too much into reproducing the example here, or leaning on the example to explain our concepts. We should do neither. [...] We can simply link the examples to illustrate and move on." (14 Nov 2026)

> "Bring up the actual question so users have something tangible to latch on" (14 Nov 2026)

> "this feels like a jab against the ruling party because it comes off as a superflous motion" (14 Nov 2026)

- Before: two paragraphs on the 2019 Budget debate on transport, quoting the MP who moved a cut, and ending "the record closes with the sums the House agreed."
- After: "An MP may, for example, propose a $100 cut to a ministry's budget as a way to debate its work." The words "propose a $100 cut to a ministry's budget" link to that debate.
- Before: "Questions and answers on personal mobility device safety are one example."
- After: "In November 2019, for example, one MP asked what the Ministry of Transport would do to make footpaths as safe as they were before personal mobility devices were allowed on them. In reply, the Government announced that e-scooters would be banned from footpaths from the next day."
- Before: "an MP proposed a motion to honour the contributions of the Singapore Police Force and its officers"
- After: "the Deputy Prime Minister proposed a motion to endorse a Government plan for Singapore's population. After five days of debate, Parliament amended the motion and agreed to it by 77 votes to 13."

(inferred) The link text is the content itself, such as the question the MP asked, and it links to that one speech. After "cite the announcement" (14 Nov 2026), the words "announced that e-scooters would be banned from footpaths from the next day" became the link.

### 8. Keep to the page's subject

Each page explains one subject. How Parliament works explains Parliament and the Hansard, and says nothing about how this site works or what it offers. A link to a site page sits inside a sentence about Parliament. On any page, a fact that belongs to another page's subject goes to that page.

> "We are explaining hansard, not this website. Do not conflate the two" (14 Nov 2026)

> "We should not be promoting features of our website blatantly" (14 Nov 2026, rejecting an ending that sent readers to the site's MP pages)

- Before: "This site copies the Official Report from 1955 to now, but Parliament's own copy is the authoritative text."
- After: "Its records go back to 1955, when Parliament was known as the Legislative Assembly."

A site link that stayed: "Elected MPs, including your MP, bring their constituents' concerns to Parliament." The words "your MP" link to the list of current MPs.

### 9. Say exactly what is true

Check the scope of each claim. Name the body that actually acts, and include every case the claim covers. Don't widen a claim to make it simpler, or narrow it to make it tidier. If you think a claim is too wide or too narrow but the text you were given doesn't say what the right scope is, list it in your reply and leave the claim as it is.

> "Government is grouped together as a whole body to spend. This is not true. [...] So this should be corrected to each ministry" (14 Nov 2026)

> "only government policies? I am pretty sure there government stances such as the stance against, say, a particular war would fall under here. It is not clear" (14 Nov 2026)

- Before: "the Supply Bill, which sets what the Government may spend in the coming financial year."
- After: "the Supply Bill, which sets how much each ministry may spend in the coming financial year."
- Before: "Through motions, Parliament can endorse or criticise Government policies."
- After: "Through motions, Parliament can endorse or criticise Government policies, or express an opinion on other matters."

## Mechanics

### Sentences

- Split a sentence where a second idea is added after a comma, and keep the linking word ("because", "but", "so") when you split.
  > "Shorter sentences. We can do a fullstop here and then continue the explanation" (14 Nov 2026, on a 41-word sentence)
  - Before: "Most MPs are elected at a general election, either alone for a Single Member Constituency (SMC) or, since 1988, as a team for a Group Representation Constituency (GRC), where at least one of the team must come from a minority community."
  - After: "Elected MPs win seats at a general election or a by-election. Each represents a Single Member Constituency (SMC) or, as part of a team, a Group Representation Constituency (GRC). A GRC team includes at least one member of a minority community."
- On explanatory pages, write paragraphs, not telegrams. Vary sentence length, let some sentences run past 20 words, and keep the word that links one sentence to the next. The 15 to 25 word average in plain-language guides is a ceiling to check against, not a target. A run of short sentences of one length with nothing joining them reads as machine-written ([Wikipedia, Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing); [digital.gov, write short sentences](https://digital.gov/guides/plain-language/writing/clear-short)). The draft of How Parliament works that Royce called "excellent" averages 14 words a sentence, and 11 of its 61 sentences run past 20 words.
  - Before: "Royce fixes it and lists each fix in the corrections log, newest first."
  - After: "Tell me and I'll fix it. Each fix goes in the corrections log, newest first, so you can see what changed and when."
- In interface text, keep to one idea per sentence. On AutomationHub, on 4 Nov 2026, he called a prompt that chained three clauses "very clunky".

<!-- pending ruling: Royce's "Shorter sentences. We can do a fullstop here" (14 Nov) can be read against app/STYLE.md's "Write paragraphs, not telegrams... let some sentences run past 20 words". Recommendation: both hold. Split where a second idea follows a comma, and keep a long sentence that carries one idea and its reason. The r6 figures above show he approved that mix. -->

### Commas and punctuation

- Use the Oxford comma in every list of three or more, in all site copy, interface text included. Royce asked for it on 14 Nov 2026 ("oxford comma") and made it site-wide the same day.
  - Before: "Parliament makes laws, decides what the Government may spend and holds the Government to account."
  - After: "Parliament makes laws, decides what the Government may spend, and holds the Government to account."
- Don't join a term and its plain meaning with "or", because "or" tells the reader they are two different things.
  > "is assents the same thing as gives approval? If so, "or" is the wrong word to use here" (14 Nov 2026)
  - Before: "Once the President assents, or gives approval, a Bill becomes an Act."
  - After: "Once the President approves a Bill, it becomes an Act."
- House rules, repeated from `app/STYLE.md` so this guide stands alone: no em dashes, and no en dash used as one; straight quotes; sentence case for headings, buttons, and page titles, with no full stop at the end; no "please", "sorry", or exclamation marks.

### Footnotes

Royce, 14 Nov 2026: "Footnotes are to be used sparingly. Using footnotes to explain something is a sign that it isn't explained well."

- Fix the explanation in the main text first.
- A footnote holds only an exception the reader doesn't need in order to follow the page.
- A footnote is at most two sentences, and keeps to the core idea: "only drill down to the core concepts" (14 Nov 2026).
- Interface text never has a footnote. A note beside a printed value on a record page follows `docs/adr/0006-display-what-the-record-prints.md`, and this guide doesn't change it.
- Before (66 words): "By convention, Ministers come from the elected MPs of the party that forms the Government, and Parliament's own guides describe them that way. An NCMP comes from a party outside the Government, and an NMP who became a Minister still could not vote on the Bill that approves their own Government's spending or on a vote of no confidence, so either appointment would be highly unusual."
- After (38 words): "By convention, Ministers are elected MPs from the party that forms the Government. NCMPs come from outside the Government, while NMPs cannot vote on Government spending Bills or a vote of no confidence, making either appointment highly unusual."

### Terms

Royce ruled the first three on 14 Nov 2026. The fourth repeats `app/STYLE.md`.

- Terms on Data quality and methods stays the one glossary of the archive's words.
- An explanatory page defines a term the first time it uses it, in that sentence or the next (rule 2).
- Any other page a lay reader sees, such as Home or Coverage, uses a plain word in place of a term it would have to define.
- Interface text links a term to Terms on Data quality and methods, or opens its definition on a tap, and never explains it in brackets.
- (inferred) Describe the thing first, then give its name: "...leaves some details to be filled in later, without passing a new Act. These details are called subsidiary legislation."
- (inferred) When a plain word does the job and the term isn't needed again, drop the term. "Assents" became "approves".
- Write a body's full name each time, unless the page has already given a short name for it. "What council?" (14 Nov 2026) turned "sent to the Council" into "sent to the Presidential Council for Minority Rights".
- When text names a mark on the screen, say what it looks like and where it sits. "the "i" [...] feels like it came out of nowhere" (7 Nov 2026) turned "Credits to a Deputy Speaker or a Chairman carry an i" into "Credits to a Deputy Speaker or a Chairman carry a small i beside the person's name."

### Numbers and dates

- On a page for lay readers, give a rate as a percentage, the form readers already know. On Data quality and methods, keep a raw count such as "1 of 464" where the page gives one, because a researcher wants the count. "Let's do percentages instead" (7 Nov 2026). He asked the same of his resume on 6 Nov 2026: "Do percentage."
  - Before: "In reports from 1955 to 2011, 7 paragraphs in 10,000 had one of these mistakes."
  - After: "In reports from 1955 to 2011, 0.07% of paragraphs had one of these mistakes."
- On a lay page, give the finding and what it means for the reader. Confidence limits, sample sizes, and how a check was done belong on Data quality and methods (rule 4).
  - Before: "...7 paragraphs in 10,000 had one of these errors, and very likely no more than 12. [...] "Very likely" here means at 95% confidence. The checks picked paragraphs at random..."
  - After: "These checks cover only part of the archive, so they can miss mistakes, including in the current Parliament."
- When text says something happens, say when (rule 3).

### Voice

On explanatory pages:

- Write as "I". Say "I'm Royce" where the page first says "I", and write "I" after that. Leave the surname out of first-person text, because nobody introduces themselves that way. A byline such as "Built and run by Royce Hoe" is a signature and keeps the full name. Never write "we", since one person runs the site. Things the software does keep the archive or the site as their subject ("The archive splits each report into speeches").
- Keep the reason that the reader can't work out alone. Over-explaining is a fault of toasts, notices, and labels, but on these pages the reason is often the point, so keep the "because" that says why a rule exists or what a figure means. Cut a reason the page already makes plain. "It is the authoritative text" went from About (14 Nov 2026), because the sentences before it already said the site isn't official and to quote Parliament's Official Report.
- (inferred) How Parliament works is about Parliament, not about Royce or the site, so it has no "I" (rule 8).

<!-- pending ruling: app/STYLE.md said "Keep the reason... keep the 'because' that says why a rule exists", and on 14 Nov Royce cut "It is the authoritative text" from About as implied. Recommendation: keep a reason the reader can't work out, and cut one the page already makes plain, as written above. -->

Everywhere else:

- No first person ("we", "I", "our") in interface text or on record pages. State the fact, since the app is a record, not a speaker.
- In page prose, use the active voice and name who acts (rule 3). Interface text follows the Copy section of `app/STYLE.md`.

## Checklist

Run this on each page you change, in order, and fix what fails before you move on.

1. Name the page's reader from the table. If the page isn't in the table, stop and ask.
2. Under each heading, does the first sentence answer the heading?
3. Mark every word a newcomer might not know, including short names and marks on the screen. On an explanatory page, is each defined where it first appears? On Home or Coverage, is it replaced by a plain word? In interface text, does it link to Terms?
4. In page prose, does any sentence leave who, when, or where open? Replace "some", "others", "it", and "the authority" with who they mean when the text you were given says who. Otherwise list the question in your reply.
5. For each sentence, would the reader miss it, and could they work it out from what the page already says? Cut it if they wouldn't miss it or could work it out.
6. Before a list of kinds or ways, does a sentence say how many? Does every paragraph in a "First, Second" set have its marker? Does a closing summary open with a word such as "In all,"?
7. Do sentences, paragraphs, and labels that do the same job start the same way?
8. Is each example one or two sentences, real, linked to the exact speech or report, and free of any side-taking? Does the link text say what was asked, announced, or decided?
9. On How Parliament works, does any sentence describe or promote this site?
10. Does any claim name a bigger or smaller group than the one that acts, or leave out cases it covers? Does any "or" join two words that mean the same thing?
11. Does every list of three or more have the Oxford comma?
12. For each footnote, can the main text carry it instead? If not, is it one exception in two sentences or fewer? Interface text has none.
13. On a lay page, are rates given as percentages? Does it carry confidence limits or sample sizes that belong on Data quality and methods?
14. On an explanatory page, is it "I", never "we", with "I'm Royce" at the first "I"? Read each paragraph aloud. If it sounds like a telegram, join the sentences that share a subject or a cause. If a sentence adds a second idea after a comma, split it.
15. Is every fact, figure, date, name, link target, placeholder, and kept word unchanged? On Home and About, did you add no sentence? List every fact you cut and every question you couldn't answer from the text.

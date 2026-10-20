# 0002. No government identity marks

The site should look like it belongs with modern Singapore Government websites, and its palette comes from Parliament House and national insignia. Copying the identity marks would make it pass for an official site. Those marks are the "A Singapore Government Agency Website" masthead, the State Crest artwork, the Lion Head symbol, gov.sg branding and a gov.sg-style domain. A reader would then trust our parsed and attributed Hansard text as the official record, and it isn't. The Singapore Arms and Flag and National Anthem Act also restricts how the crest and flag can be used. The site borrows layout and interaction patterns from SGDS v3 and Isomer, such as spacing, type scale, navigation, search, tables and footers. It takes colours from insignia, never the artwork itself. The header uses a plain wordmark, and every page footer says the site is not official. Anyone adding a component or asset that carries an official mark needs to overturn this ADR first.

## Amendment, 14 Oct 2026

The footer line changed from "Unofficial. Independent of the Parliament of Singapore." to "Not an official Parliament site." Royce found the old line wordy. The short line still tells a reader the site is not the official record, which is what this decision needs the footer to do. It no longer states independence from Parliament on purpose: saying the site is not official is enough to stop it passing for the official record.

## Amendment, 19 Oct 2026

The footer now reads "This is not an official Parliament site. The Official Report on SPRS is the authoritative record." This wording takes precedence over the shorter line. Report, sitting and person pages also carry the attribution line "Source: Parliament of Singapore, Official Report", with the sitting date where the page has one. A speech's preview card puts "Unofficial transcript" before its title and the footer's first sentence after its quote, because a card shared in a chat app shows no footer.

## Amendment, 20 Oct 2026

The footer is back to "Not an official Parliament site.", with the date the data was last checked below it. Royce found the SPRS sentence superfluous. The short line still tells a reader the site is not the official record, which is all this decision needs from the footer. The attribution line on report, sitting and person pages still names the Official Report. The speech preview card keeps "This is not an official Parliament site." after its quote, because a card shared in a chat app shows no footer.

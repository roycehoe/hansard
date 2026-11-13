const ACT_TITLE_YEAR_PATTERN = /\s+\d{4}$/
const BILL_TITLE_AMENDMENT_PATTERN =
  /\s*\((No\.? ?\d+ )?Amendment( No\.? ?\d+)?\)/gi
const BILL_TITLE_SUFFIX_PATTERN = /\s+Bill$/i
const WHITESPACE_PATTERN = /\s+/g

export function isBillNamedForAct(
  actTitle: string,
  billTitle: string
): boolean {
  const actName = actTitle.replace(ACT_TITLE_YEAR_PATTERN, '').toLowerCase()
  const billName = billTitle
    .replace(BILL_TITLE_AMENDMENT_PATTERN, '')
    .replace(BILL_TITLE_SUFFIX_PATTERN, '')
    .replace(WHITESPACE_PATTERN, ' ')
    .toLowerCase()
  return actName === billName || actName === `${billName} act`
}

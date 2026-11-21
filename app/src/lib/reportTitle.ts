import type { GetReportResponse } from '@/api/reports/getReport'
import {
  FIRST_READING_TITLE_LABEL,
  MINISTERS_REPLY_TITLE_LABEL,
  SECOND_AND_THIRD_READING_TITLE_LABEL,
  SECOND_READING_DEBATE_RESUMED_TITLE_LABEL,
  SECOND_READING_TITLE_LABEL,
  THIRD_READING_TITLE_LABEL,
} from '@/constants/bills/constants'
import { BillReportPart, BillStage } from '@/constants/bills/enums'

const LEADING_THE_PATTERN = /^the\s+/i
const BILL_WORD_PATTERN = /\bbill\b/i

function getStageTitleLabel(stage: BillStage): string {
  if (stage === BillStage.FIRST_READING) return FIRST_READING_TITLE_LABEL
  if (stage === BillStage.THIRD_READING) return THIRD_READING_TITLE_LABEL
  return SECOND_READING_TITLE_LABEL
}

// NOTE: the same title the server writes for search engines (services/preview.py): a part of a Bill debate takes the words of the part the server worked out, else it opens on the first stage the record prints for it, and a report whose title names no Bill keeps its title
export function formatReportPageTitle(report: GetReportResponse): string {
  const reportPart = report.bill?.report_part
  if (reportPart === BillReportPart.MINISTERS_REPLY) {
    return `${MINISTERS_REPLY_TITLE_LABEL}, ${report.title}`
  }
  if (reportPart === BillReportPart.SECOND_READING_DEBATE_RESUMED) {
    return `${SECOND_READING_DEBATE_RESUMED_TITLE_LABEL}, ${report.title}`
  }
  if (reportPart === BillReportPart.SECOND_AND_THIRD_READING) {
    return `${SECOND_AND_THIRD_READING_TITLE_LABEL} of the ${report.title.replace(LEADING_THE_PATTERN, '')}`
  }
  const stage = report.bill?.reports.find(
    (billReport) => billReport.report_slug === report.report_slug
  )?.stages[0]
  if (stage === undefined || !BILL_WORD_PATTERN.test(report.title)) {
    return report.title
  }
  return `${getStageTitleLabel(stage)} of the ${report.title.replace(LEADING_THE_PATTERN, '')}`
}

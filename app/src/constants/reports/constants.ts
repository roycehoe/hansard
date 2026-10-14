import { ReportType } from '@/constants/reports/enums'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.ORAL_ANSWER]: 'Oral answer',
  [ReportType.WRITTEN_ANSWER]: 'Written answer',
  [ReportType.WRITTEN_ANSWER_NA]: 'Written answer not available',
  [ReportType.CLARIFICATION]: 'Clarification',
  [ReportType.MOTION]: 'Motion',
  [ReportType.MATTER_ADJ]: 'Adjournment matter',
  [ReportType.BILL]: 'Bill',
  [ReportType.BILL_INTRO]: 'Bill introduction',
  [ReportType.MINISTERIAL_STATEMENT]: 'Ministerial statement',
  [ReportType.WRITTEN_STATEMENT]: 'Written statement',
  [ReportType.BUDGET]: 'Budget',
  [ReportType.SPEAKER]: "Presiding officer's statement",
  [ReportType.DEPUTY_SPEAKER]: "Deputy Speaker's statement",
  [ReportType.PERSONAL_EXPLANATION]: 'Personal explanation',
  [ReportType.POINT_OF_ORDER]: 'Point of order',
  [ReportType.TRIBUTE]: 'Tribute',
  [ReportType.PRESIDENT_ADDRESS]: "President's address",
  [ReportType.PETITION]: 'Petition',
  [ReportType.ADMIN_OATHS]: 'Administration of oaths',
  [ReportType.OBITUARY_SPEECH]: 'Obituary speech',
  [ReportType.YANG_DI_MESSAGE]: 'Message from the Yang di-Pertuan Negara',
  [ReportType.MISC]: 'Miscellaneous',
  [ReportType.ATBP]: 'Assent to bills passed',
}

export const REPORT_TYPE_DROPDOWN_OPTIONS = Object.values(ReportType).map(
  (value) => ({ value, label: REPORT_TYPE_LABELS[value] })
)

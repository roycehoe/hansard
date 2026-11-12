export interface ActSummaryData {
  sso_code: string
  title: string
}

export interface GetAllActsResponse {
  acts: ActSummaryData[]
}

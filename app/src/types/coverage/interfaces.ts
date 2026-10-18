export interface AttributionRow {
  parliament: string
  years: string
  handCheckDate: string | null
  namedLinked: string
  allLinked: string
  textShare: string
}

export interface AttributionHeadline {
  measuredOn: string
  namedLinked: string
  allLinked: string
  textShare: string
  linkedRowCount: number
  speakerLabelRowCount: number
  rowCount: number
}

export interface AttributionFigures {
  rows: AttributionRow[]
  headline: AttributionHeadline
}

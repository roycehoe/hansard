export interface AttributionRow {
  parliament: string
  years: string
  handCheckDate: string | null
  namedLinked: string
  allLinked: string
  textShare: string
}

export interface AttributionFigures {
  rows: AttributionRow[]
  measuredOn: string
}

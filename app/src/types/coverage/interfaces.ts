export interface AttributionRow {
  parliament: string
  years: string
  namedLinked: string
  allLinked: string
  textShare: string
}

export interface AttributionFigures {
  rows: AttributionRow[]
  measuredOn: string
}

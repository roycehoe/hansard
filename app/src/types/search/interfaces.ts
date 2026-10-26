export interface ConstituencyData {
  name: string
  parliamentNumbers: number[]
  isCurrent: boolean
}

export interface MembershipFilters {
  parliamentNumber: number | undefined
  personId: number | undefined
  constituency: string
}

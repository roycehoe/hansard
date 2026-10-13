import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/reports/constants'
import { format, parseISO } from 'date-fns'

const SITTING_DATE_FORMAT = 'd MMMM yyyy'

export function formatSittingDate(sittingDate: string): string {
  return format(parseISO(sittingDate), SITTING_DATE_FORMAT)
}

export function formatParliament(parliamentNumber: number): string {
  return parliamentNumber === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
    ? LEGISLATIVE_ASSEMBLY_LABEL
    : `Parliament ${parliamentNumber}`
}

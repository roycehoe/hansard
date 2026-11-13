import { ActEventKind } from '@/constants/acts/enums'

export const ACT_NOT_FOUND_ERROR_CODE = 'act.not_found'

export const ACT_TITLE_SUFFIX = 'Bills and debates in Parliament'

export const ACT_SOURCE_NAME = 'Singapore Statutes Online'

export const ORIGINAL_LABEL = 'Original'

export const IN_FORCE_LABEL = 'In force'

export const BACKDATED_LABEL = 'backdated'

export const ACT_EVENT_KIND_LABELS: Record<ActEventKind, string> = {
  [ActEventKind.READING]: 'Readings',
  [ActEventKind.IN_FORCE]: IN_FORCE_LABEL,
  [ActEventKind.REPRINT]: 'Reprints',
  [ActEventKind.ORDER]: 'Orders',
}

export const ACT_EVENT_KIND_SEPARATOR = ','

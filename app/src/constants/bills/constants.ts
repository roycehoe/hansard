import { BillStage } from '@/constants/bills/enums'

export const FIRST_READING_LABEL = 'First reading'

export const SECOND_READING_LABEL = 'Second reading'

export const THIRD_READING_LABEL = 'Third reading'

export const BILL_STAGE_LABELS: Record<BillStage, string> = {
  [BillStage.FIRST_READING]: FIRST_READING_LABEL,
  [BillStage.SECOND_READING_ORDER]: SECOND_READING_LABEL,
  [BillStage.SECOND_READING_AGREED]: SECOND_READING_LABEL,
  [BillStage.THIRD_READING]: THIRD_READING_LABEL,
}

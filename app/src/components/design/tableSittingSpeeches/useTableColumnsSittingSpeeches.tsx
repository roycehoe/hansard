import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatSittingDate } from '@/lib/format'
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table'

export interface SittingSpeech {
  id: string
  sittingDate: string
  parliament: number
  title: string
  speaker: string
  speechCount: number
}

export const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

const columnHelper = createColumnHelper<typeof features, SittingSpeech>()

export const columns = columnHelper.columns([
  columnHelper.accessor('sittingDate', {
    header: 'Sitting date',
    cell: (sittingDate) => formatSittingDate(sittingDate.getValue()),
  }),
  columnHelper.accessor('parliament', { header: 'Parliament' }),
  columnHelper.accessor('title', {
    header: 'Report title',
    cell: (title) => (
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <p
            className="focus-visible:ring-ring focus-visible:ring-offset-background max-w-80 truncate outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
            tabIndex={0}
          >
            {title.getValue()}
          </p>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-muted text-foreground max-w-80 rounded-md p-2 shadow-lg"
        >
          <p className="p-1 px-2 text-start">{title.getValue()}</p>
        </TooltipContent>
      </Tooltip>
    ),
  }),
  columnHelper.accessor('speaker', { header: 'Person' }),
  columnHelper.accessor('speechCount', { header: 'Paragraphs' }),
])

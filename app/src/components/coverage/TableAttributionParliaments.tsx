import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ATTRIBUTION_BY_PARLIAMENT } from '@/constants/coverage/constants'

export function TableAttributionParliaments() {
  return (
    <div className="max-w-2xl">
      <Table>
        <TableCaption className="sr-only">
          Attribution figures by Parliament
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Parliament</TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              Named speeches linked
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              All speeches linked
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              Text share
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ATTRIBUTION_BY_PARLIAMENT.map((row) => (
            <TableRow
              key={row.parliament}
              className="border-separator bg-background h-12 border-b py-4 last:border-b-0"
            >
              <TableHead scope="row" className="text-foreground">
                {row.parliament}
              </TableHead>
              <TableCell className="text-right tabular-nums">
                {row.namedLinked}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.allLinked}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.textShare}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

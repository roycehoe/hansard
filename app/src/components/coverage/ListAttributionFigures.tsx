import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ATTRIBUTION_BY_PARLIAMENT,
  ATTRIBUTION_FIGURES,
  ATTRIBUTION_LATER_MEASURED_ON,
  ATTRIBUTION_MEASURED_ON,
  ATTRIBUTION_SCOPE,
} from '@/constants/coverage/constants'
import { formatSittingDate } from '@/lib/format'

export function ListAttributionFigures() {
  return (
    <section aria-labelledby="attribution-heading" className="space-y-4">
      <h2 id="attribution-heading" className="font-serif text-xl lg:text-2xl">
        How well speeches are linked to people
      </h2>
      <p className="text-muted-foreground text-sm">
        Measured by the scraper on {formatSittingDate(ATTRIBUTION_MEASURED_ON)}{' '}
        for {ATTRIBUTION_SCOPE}. The three figures are quoted together because
        each denominator hides something the others show.
      </p>
      <dl className="grid gap-4 lg:grid-cols-3">
        {ATTRIBUTION_FIGURES.map((figure) => (
          <div key={figure.label} className="space-y-1">
            <dt className="text-sm font-medium">{figure.label}</dt>
            <dd className="space-y-1">
              <span className="block text-lg font-semibold tabular-nums">
                {figure.value}
              </span>
              <span className="text-muted-foreground block text-sm">
                {figure.detail}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="max-w-2xl">
        <Table>
          <TableCaption className="sr-only">
            Attribution figures by Parliament
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Parliament</TableHead>
              <TableHead className="text-right whitespace-normal">
                Named speeches linked
              </TableHead>
              <TableHead className="text-right whitespace-normal">
                All speeches linked
              </TableHead>
              <TableHead className="text-right whitespace-normal">
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
      <p className="text-muted-foreground text-sm">
        Parliaments 0 to 11 were measured on{' '}
        {formatSittingDate(ATTRIBUTION_MEASURED_ON)}. Parliaments 12 to 14 were
        measured on {formatSittingDate(ATTRIBUTION_LATER_MEASURED_ON)}, after
        text from 10 September 2012 was loaded, and no hand check covers those
        rows yet. Parliament 12 is the whole Parliament, which straddles the
        change of system.
      </p>
    </section>
  )
}

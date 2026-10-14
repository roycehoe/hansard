import {
  ATTRIBUTION_FIGURES,
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
    </section>
  )
}

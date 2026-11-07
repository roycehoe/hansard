import { pickActiveYear } from '@/lib/sittingYears'
import { useEffect, useState } from 'react'

const BELOW_YEAR_BAR_MARGIN = '-45px 0px 0px 0px'

export function useActiveYear(years: number[], hash: string) {
  const [visibleYears, setVisibleYears] = useState<number[]>([])

  useEffect(
    function observeYearSections() {
      const visible = new Set<number>()
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const year = Number((entry.target as HTMLElement).dataset.year)
            if (entry.isIntersecting) visible.add(year)
            else visible.delete(year)
          }
          setVisibleYears([...visible])
        },
        { rootMargin: BELOW_YEAR_BAR_MARGIN }
      )
      for (const section of document.querySelectorAll('section[data-year]')) {
        observer.observe(section)
      }
      return () => observer.disconnect()
    },
    [years]
  )

  return { activeYear: pickActiveYear(years, visibleYears, hash) }
}

import { useActiveYear } from '@/hooks/useActiveYear'
import { cn } from '@/lib/utils'
import { Link, useLocation } from '@tanstack/react-router'
import type { MouseEvent } from 'react'
import { useEffect, useRef } from 'react'

interface ListYearLinksProps {
  years: number[]
  parliamentNumber: number
}

export function ListYearLinks({ years, parliamentNumber }: ListYearLinksProps) {
  const hash = useLocation({ select: (location) => location.hash })
  const { activeYear } = useActiveYear(years, hash)
  const barRef = useRef<HTMLElement>(null)

  useEffect(
    function keepActiveYearInView() {
      const bar = barRef.current
      const link = bar?.querySelector<HTMLElement>('[aria-current="location"]')
      if (!bar || !link) return
      bar.scrollLeft =
        link.offsetLeft + link.offsetWidth / 2 - bar.clientWidth / 2
    },
    [activeYear]
  )

  function jumpToYear(event: MouseEvent<HTMLAnchorElement>) {
    const yearId = event.currentTarget.hash.slice(1)
    const heading = document.getElementById(yearId)
    if (yearId === hash) {
      event.preventDefault()
      heading?.scrollIntoView()
    }
    heading?.focus({ preventScroll: true })
  }

  return (
    <nav
      ref={barRef}
      aria-label="Years"
      className="bg-background border-separator sticky top-0 z-10 -mx-5 snap-x snap-mandatory scroll-pl-5 [scrollbar-width:none] overflow-x-auto border-b sm:mx-0 sm:scroll-pl-0"
    >
      <ol className="flex w-max gap-5 px-5 sm:gap-6 sm:px-0">
        {years.map((year) => (
          <li key={year} className="snap-start">
            <Link
              to="/sittings"
              search={{ parliament: parliamentNumber }}
              hash={String(year)}
              onClick={jumpToYear}
              aria-current={year === activeYear ? 'location' : undefined}
              className={cn(
                'focus-visible:decoration-ring flex h-11 min-w-9 items-center justify-center border-b-2 border-transparent text-sm tabular-nums outline-hidden hover:underline focus-visible:underline sm:h-10',
                year === activeYear
                  ? 'border-primary-border text-foreground font-semibold'
                  : 'text-link'
              )}
            >
              {year}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}

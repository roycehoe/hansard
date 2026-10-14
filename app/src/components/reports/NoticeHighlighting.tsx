import { Link, useLocation } from '@tanstack/react-router'

interface NoticeHighlightingProps {
  reportSlug: string
  terms: string[]
}

export function NoticeHighlighting({
  reportSlug,
  terms,
}: NoticeHighlightingProps) {
  const hash = useLocation({ select: (location) => location.hash })

  return (
    <p className="mb-6 text-sm">
      <span className="text-muted-foreground">
        Highlighting: {terms.join(' ')}
      </span>
      {' · '}
      <Link
        to="/reports/$reportSlug"
        params={{ reportSlug }}
        hash={hash}
        className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Clear highlighting
      </Link>
    </p>
  )
}

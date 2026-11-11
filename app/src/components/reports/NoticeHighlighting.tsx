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
    <p className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <span className="text-muted-foreground">
        Highlighting: {terms.join(' ')}
      </span>
      <Link
        to="/reports/$reportSlug"
        params={{ reportSlug }}
        search={(previous) => ({ ...previous, hl: undefined })}
        hash={hash}
        className="text-link focus-visible:outline-ring rounded-sm underline underline-offset-4 outline-hidden hover:underline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid"
      >
        Clear highlighting
      </Link>
    </p>
  )
}

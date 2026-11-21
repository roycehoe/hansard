import { TRANSCRIPT_FOOTNOTE_CLASS_NAME } from '@/constants/reports/constants'
import { cn } from '@/lib/utils'

interface TextPictureSourceProps {
  href: string
}

export function TextPictureSource({ href }: TextPictureSourceProps) {
  return (
    <p className={cn('mt-3 flow-root', TRANSCRIPT_FOOTNOTE_CLASS_NAME)}>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="text-link decoration-ring underline underline-offset-4 outline-hidden hover:underline focus-visible:underline"
      >
        source
      </a>
    </p>
  )
}

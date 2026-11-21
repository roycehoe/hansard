import { LinkExternal } from '@/components/layout/LinkExternal'
import { TRANSCRIPT_FOOTNOTE_CLASS_NAME } from '@/constants/reports/constants'
import { cn } from '@/lib/utils'

interface TextPictureSourceProps {
  href: string
}

export function TextPictureSource({ href }: TextPictureSourceProps) {
  return (
    <p className={cn('mt-3 flow-root', TRANSCRIPT_FOOTNOTE_CLASS_NAME)}>
      <LinkExternal href={href}>source</LinkExternal>
    </p>
  )
}

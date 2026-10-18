import { SPEECH_LINK_NOTICE_ID } from '@/constants/reports/constants'

interface NoticeSpeechLinkProps {
  message: string
}

export function NoticeSpeechLink({ message }: NoticeSpeechLinkProps) {
  return (
    <p
      id={SPEECH_LINK_NOTICE_ID}
      className="text-muted-foreground my-6 scroll-mt-24 text-sm first:mt-0"
    >
      {message}
    </p>
  )
}

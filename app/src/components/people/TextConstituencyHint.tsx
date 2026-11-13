import { LinkExternal } from '@/components/layout/LinkExternal'
import { POSTAL_CODE_ENQUIRY_URL } from '@/constants/people/constants'
import { CONSTITUENCY_HINT_TEXT } from '@/constants/search/constants'

export function TextConstituencyHint() {
  return (
    <div className="flex flex-col gap-2">
      <p>{CONSTITUENCY_HINT_TEXT}</p>
      <p>
        Not sure which is yours?{' '}
        <LinkExternal href={POSTAL_CODE_ENQUIRY_URL}>
          Find your constituency
        </LinkExternal>
        .
      </p>
    </div>
  )
}

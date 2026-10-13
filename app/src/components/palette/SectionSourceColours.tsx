import { SOURCE_COLOURS_GROUP } from '@/constants/palette/constants'
import { GroupColours } from './GroupColours'

export function SectionSourceColours() {
  return (
    <section
      aria-labelledby="source-colours"
      className="border-separator space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <h2
        id="source-colours"
        className="font-serif text-xl font-semibold lg:text-2xl"
      >
        {SOURCE_COLOURS_GROUP.title}
      </h2>
      <GroupColours group={SOURCE_COLOURS_GROUP} />
    </section>
  )
}

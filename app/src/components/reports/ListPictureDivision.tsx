import type { TypedTableData } from '@/api/reports/getReport'
import { TextTypedCopy } from '@/components/reports/TextTypedCopy'

interface ListPictureDivisionProps {
  groups: TypedTableData[]
}

export function ListPictureDivision({ groups }: ListPictureDivisionProps) {
  return groups.map((group, groupIndex) => (
    <div key={groupIndex} className="mt-3">
      <p className="text-muted-foreground text-sm leading-5 font-medium">
        <TextTypedCopy text={group.caption} />
      </p>
      <ul className="mt-1 text-sm leading-6 sm:columns-2 lg:columns-3">
        {group.body_rows.map((row, rowIndex) => (
          <li key={rowIndex} className="break-inside-avoid">
            <TextTypedCopy text={row[0]} />
          </li>
        ))}
      </ul>
    </div>
  ))
}

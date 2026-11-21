import { splitSuperscripts } from '@/lib/typedSuperscript'

interface TextTypedCopyProps {
  text: string
}

export function TextTypedCopy({ text }: TextTypedCopyProps) {
  return splitSuperscripts(text).map((segment, index) =>
    segment.isSuperscript ? (
      <sup key={index}>{segment.text}</sup>
    ) : (
      <span key={index}>{segment.text}</span>
    )
  )
}

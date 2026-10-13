import { Badge } from '@/components/ui/badge'

interface BadgeColourTokensProps {
  tokens: string[]
}

export function BadgeColourTokens({ tokens }: BadgeColourTokensProps) {
  return (
    <ul
      aria-label="Tokens that use this colour"
      className="flex flex-wrap gap-1"
    >
      {tokens.map((token) => (
        <li key={token}>
          <Badge variant="outline" className="font-mono">
            {token}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

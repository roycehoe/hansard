// Checks WCAG 2.2 AA contrast for the colour tokens in src/index.css.
// Run with `pnpm contrast`. Exits 1 if any pair fails or a token is missing.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CSS_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/index.css'
)

const TEXT_MINIMUM = 4.5
const UI_MINIMUM = 3

interface Pair {
  foreground: string
  background: string
  minimum: number
}

function pairs(
  foreground: string,
  backgrounds: string[],
  minimum: number
): Pair[] {
  return backgrounds.map((background) => ({ foreground, background, minimum }))
}

const SURFACES = ['background', 'card']

const PAIRS: Pair[] = [
  // Text on its own surface
  ...pairs('foreground', ['background', 'muted', 'secondary'], TEXT_MINIMUM),
  ...pairs('card-foreground', ['card'], TEXT_MINIMUM),
  ...pairs('popover-foreground', ['popover'], TEXT_MINIMUM),
  ...pairs(
    'primary-foreground',
    ['primary', 'primary-hover', 'primary-active'],
    TEXT_MINIMUM
  ),
  ...pairs(
    'secondary-foreground',
    ['secondary', 'secondary-hover', 'secondary-active'],
    TEXT_MINIMUM
  ),
  ...pairs('accent-foreground', ['accent'], TEXT_MINIMUM),
  ...pairs(
    'destructive-foreground',
    ['destructive', 'destructive-hover', 'destructive-active'],
    TEXT_MINIMUM
  ),
  ...pairs('success-foreground', ['success'], TEXT_MINIMUM),
  ...pairs('warning-foreground', ['warning'], TEXT_MINIMUM),
  ...pairs('info-foreground', ['info'], TEXT_MINIMUM),
  ...pairs('reading-foreground', ['reading'], TEXT_MINIMUM),
  ...pairs('highlight-foreground', ['highlight'], TEXT_MINIMUM),
  ...pairs('tag-foreground', ['tag'], TEXT_MINIMUM),
  ...pairs('sidebar-foreground', ['sidebar'], TEXT_MINIMUM),
  ...pairs('sidebar-primary-foreground', ['sidebar-primary'], TEXT_MINIMUM),
  ...pairs('sidebar-accent-foreground', ['sidebar-accent'], TEXT_MINIMUM),
  // Secondary text, links and state text on every surface they appear on
  ...pairs(
    'muted-foreground',
    [
      ...SURFACES,
      'muted',
      'secondary',
      'secondary-hover',
      'secondary-active',
      'accent',
      'reading',
      'highlight',
    ],
    TEXT_MINIMUM
  ),
  ...pairs('primary', [...SURFACES, 'reading', 'highlight'], TEXT_MINIMUM),
  ...pairs('primary-hover', [...SURFACES, 'reading'], TEXT_MINIMUM),
  ...pairs('destructive', SURFACES, TEXT_MINIMUM),
  ...pairs('success', SURFACES, TEXT_MINIMUM),
  ...pairs('warning', SURFACES, TEXT_MINIMUM),
  ...pairs('info', SURFACES, TEXT_MINIMUM),
  // Borders, focus rings and chart marks
  ...pairs('border', SURFACES, UI_MINIMUM),
  ...pairs('tag-border', ['tag', ...SURFACES], UI_MINIMUM),
  ...pairs('input', SURFACES, UI_MINIMUM),
  ...pairs('ring', SURFACES, UI_MINIMUM),
  ...pairs('sidebar-border', ['sidebar'], UI_MINIMUM),
  ...pairs('sidebar-ring', ['sidebar'], UI_MINIMUM),
  ...['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'].flatMap((chart) =>
    pairs(chart, SURFACES, UI_MINIMUM)
  ),
]

// Tokens with no contrast minimum (decorative lines, the dialog scrim) that
// must still be defined in both themes.
const REQUIRED = ['separator', 'overlay']

type Theme = Record<string, string>

function parseBlock(css: string, selector: string): Theme {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`no ${selector} block in ${CSS_PATH}`)
  const end = css.indexOf('}', start)
  const theme: Theme = {}
  for (const match of css
    .slice(start, end)
    .matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    theme[match[1]] = match[2]
  }
  return theme
}

function luminance(hex: string): number {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

function check(name: string, theme: Theme): boolean {
  console.log(`\n${name}`)
  let passed = true
  for (const token of REQUIRED) {
    const value = theme[token]
    passed &&= value !== undefined
    console.log(
      value ? `pass  ${token} ${value} (no minimum)` : `MISSING  ${token}`
    )
  }
  for (const pair of PAIRS) {
    const foreground = theme[pair.foreground]
    const background = theme[pair.background]
    if (!foreground || !background) {
      passed = false
      console.log(
        `MISSING  ${pair.foreground} on ${pair.background}: no 6-digit hex value`
      )
      continue
    }
    const ratio = contrast(foreground, background)
    const ok = ratio >= pair.minimum
    passed &&= ok
    console.log(
      `${ok ? 'pass' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}  ${pair.foreground} on ${pair.background}  (${foreground} on ${background}, min ${pair.minimum})`
    )
  }
  return passed
}

const css = readFileSync(CSS_PATH, 'utf8')
const lightPassed = check('light', parseBlock(css, ':root'))
const darkPassed = check('dark', parseBlock(css, '.dark'))
process.exit(lightPassed && darkPassed ? 0 : 1)

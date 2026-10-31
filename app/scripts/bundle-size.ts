// Sums the gzipped size of the scripts dist/index.html loads on first visit.
// Run with `pnpm size` after `pnpm build`. Exits 1 above the limit.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const DIST_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')

// Set just above the 31 Oct 2026 total. Raise it in the commit that needs more.
const FIRST_LOAD_LIMIT_BYTES = 215_000

const indexHtml = readFileSync(resolve(DIST_PATH, 'index.html'), 'utf8')
const scriptPaths = [...new Set(indexHtml.match(/assets\/[^"]+\.js/g) ?? [])]

let totalBytes = 0
for (const scriptPath of scriptPaths) {
  const bytes = gzipSync(readFileSync(resolve(DIST_PATH, scriptPath))).length
  totalBytes += bytes
  console.log(`${bytes.toString().padStart(8)}  ${scriptPath}`)
}

const isOverLimit = totalBytes > FIRST_LOAD_LIMIT_BYTES
console.log(
  `${totalBytes.toString().padStart(8)}  total, limit ${FIRST_LOAD_LIMIT_BYTES}`
)
if (isOverLimit) {
  console.log('First-load JavaScript is over the limit.')
  process.exit(1)
}

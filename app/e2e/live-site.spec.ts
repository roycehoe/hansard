import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const LIVE_PAGES = [
  { name: 'home', path: '/' },
  { name: 'report', path: '/reports/written-answer-16079' },
  { name: 'search', path: '/search?q=heat+stress' },
]

let page: Page
const consoleErrors: string[] = []

test.beforeAll(async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL })
  page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))
})

test.afterAll(async () => {
  await page.close()
})

for (const livePage of LIVE_PAGES) {
  test(`${livePage.name} draws a heading, logs no errors and passes axe`, async () => {
    consoleErrors.length = 0
    await page.goto(livePage.path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(consoleErrors).toEqual([])

    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze()
    expect(
      violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      }))
    ).toEqual([])
  })
}

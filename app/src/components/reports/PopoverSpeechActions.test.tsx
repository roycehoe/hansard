// @vitest-environment jsdom
import { PopoverSpeechActions } from '@/components/reports/PopoverSpeechActions'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

const DOTS_LABEL = 'Actions for paragraph 3'

let container: HTMLElement
let root: Root

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function renderMenu() {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <PopoverSpeechActions
        reportSlug="report"
        reportTitle="Report"
        ordinal={3}
        anchor="s3"
        officialRecordUrl="https://example.com"
        speakerLabel="Mr Speaker"
        transcript="Order."
        sittingDate="2026-10-07"
      />
    )
  })
  return container.querySelector<HTMLButtonElement>(
    `button[aria-label="${DOTS_LABEL}"]`
  )!
}

function tap(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

async function pressEscape() {
  await act(async () => {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
}

function getMenu() {
  return document.querySelector('[role="dialog"]')
}

describe('PopoverSpeechActions', () => {
  it('builds no menu until the first tap', () => {
    const dots = renderMenu()
    expect(dots.hasAttribute('aria-haspopup')).toBe(false)
    expect(getMenu()).toBeNull()
    tap(dots)
    expect(getMenu()).not.toBeNull()
  })

  it('returns focus to the dots after the first menu closes', async () => {
    renderMenu()
    tap(container.querySelector(`button[aria-label="${DOTS_LABEL}"]`)!)
    expect(getMenu()).not.toBeNull()
    await pressEscape()
    expect(getMenu()).toBeNull()
    expect(document.activeElement).toBe(
      container.querySelector(`button[aria-label="${DOTS_LABEL}"]`)
    )
  })

  it('returns focus to the dots after a later menu closes', async () => {
    renderMenu()
    const tapDots = () =>
      tap(container.querySelector(`button[aria-label="${DOTS_LABEL}"]`)!)
    tapDots()
    await pressEscape()
    tapDots()
    expect(getMenu()).not.toBeNull()
    await pressEscape()
    expect(document.activeElement).toBe(
      container.querySelector(`button[aria-label="${DOTS_LABEL}"]`)
    )
  })
})

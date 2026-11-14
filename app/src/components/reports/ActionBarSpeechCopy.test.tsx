// @vitest-environment jsdom
import { ActionBarSpeechCopy } from '@/components/reports/ActionBarSpeechCopy'
import { TooltipProvider } from '@/components/ui/tooltip'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const REPORT_ADDRESS = '/reports/report'
const PARAGRAPH_ADDRESS = '/reports/report?s=3&q=s3'

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

beforeEach(() => {
  window.history.replaceState(null, '', REPORT_ADDRESS)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function renderIcons() {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <TooltipProvider>
        <ActionBarSpeechCopy
          reportSlug="report"
          reportTitle="Report"
          ordinal={3}
          anchor="s3"
          officialRecordUrl="https://example.com"
          speakerLabel="Mr Speaker"
          transcript="Order."
          sittingDate="2026-10-07"
        />
      </TooltipProvider>
    )
  })
  return container.querySelector<HTMLButtonElement>(
    'button[aria-label="Copy link to paragraph 3"]'
  )!
}

function readAddress() {
  return `${window.location.pathname}${window.location.search}`
}

describe('ActionBarSpeechCopy', () => {
  it('keeps the report address until the icons are reached', () => {
    renderIcons()
    expect(readAddress()).toBe(REPORT_ADDRESS)
  })

  it('puts the paragraph link in the address when the pointer reaches the icons', () => {
    const lengthBefore = window.history.length
    const copyLinkButton = renderIcons()
    act(() => {
      copyLinkButton.parentElement!.dispatchEvent(
        new PointerEvent('pointerover', { bubbles: true })
      )
    })
    expect(readAddress()).toBe(PARAGRAPH_ADDRESS)
    expect(window.history.length).toBe(lengthBefore)
  })

  it('puts the paragraph link in the address when the keyboard reaches the icons', () => {
    const copyLinkButton = renderIcons()
    act(() => copyLinkButton.focus())
    expect(readAddress()).toBe(PARAGRAPH_ADDRESS)
  })
})

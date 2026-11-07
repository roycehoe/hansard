import { scrollAgainWhenFontsLoad } from '@/lib/scrollAgain'
import { describe, expect, it, vi } from 'vitest'

function setUp() {
  let resolveFonts: () => void = () => {}
  const fontsReady = new Promise<void>((resolve) => {
    resolveFonts = resolve
  })
  let scrollY = 1200
  const scroll = vi.fn()
  const cancel = scrollAgainWhenFontsLoad({
    fontsReady,
    getScrollY: () => scrollY,
    scroll,
  })
  return {
    scroll,
    cancel,
    moveReader: (y: number) => {
      scrollY = y
    },
    loadFonts: async () => {
      resolveFonts()
      await fontsReady
      await Promise.resolve()
    },
  }
}

describe('scrollAgainWhenFontsLoad', () => {
  it('scrolls again once the fonts load', async () => {
    const { scroll, loadFonts } = setUp()
    expect(scroll).not.toHaveBeenCalled()
    await loadFonts()
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('does not scroll again when the reader has moved', async () => {
    const { scroll, moveReader, loadFonts } = setUp()
    moveReader(1500)
    await loadFonts()
    expect(scroll).not.toHaveBeenCalled()
  })

  it('does not scroll again after cancel', async () => {
    const { scroll, cancel, loadFonts } = setUp()
    cancel()
    await loadFonts()
    expect(scroll).not.toHaveBeenCalled()
  })
})

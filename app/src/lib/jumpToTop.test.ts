import { nextJumpToTopState, type JumpToTopState } from '@/lib/jumpToTop'
import { describe, expect, it } from 'vitest'

const VIEWPORT = 800
const START: JumpToTopState = {
  lastScrollY: 4000,
  upwardTravel: 0,
  isVisible: false,
}

function scrollThrough(positions: number[]): JumpToTopState {
  return positions.reduce(
    (state, y) => nextJumpToTopState(state, y, VIEWPORT),
    START
  )
}

describe('nextJumpToTopState', () => {
  it('stays hidden while scrolling down', () => {
    expect(scrollThrough([4100, 4200, 4300]).isVisible).toBe(false)
  })

  it('stays hidden after a 40 px nudge up', () => {
    expect(scrollThrough([3960]).isVisible).toBe(false)
  })

  it('shows after 100 px of upward travel', () => {
    expect(scrollThrough([3950, 3900]).isVisible).toBe(true)
  })

  it('counts travel across several scroll events', () => {
    expect(scrollThrough([3970, 3940, 3910, 3890]).isVisible).toBe(true)
  })

  it('hides again when the reader turns to scroll down', () => {
    expect(scrollThrough([3900, 3800, 3850]).isVisible).toBe(false)
  })

  it('restarts the count after a pause', () => {
    expect(scrollThrough([3960, 3960, 3920]).isVisible).toBe(false)
  })

  it('hides within two screens of the top', () => {
    expect(scrollThrough([3000, 2000, 1500]).isVisible).toBe(false)
  })
})

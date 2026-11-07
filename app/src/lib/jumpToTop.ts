import {
  JUMP_TO_TOP_SCREEN_COUNT,
  JUMP_TO_TOP_UPWARD_TRAVEL_PX,
} from '@/constants/layout/constants'

export interface JumpToTopState {
  lastScrollY: number
  upwardTravel: number
  isVisible: boolean
}

// The button shows only while the reader is scrolling up, deeper than
// JUMP_TO_TOP_SCREEN_COUNT screens, after JUMP_TO_TOP_UPWARD_TRAVEL_PX of
// unbroken upward travel. Scrolling down or stopping hides it.
export function nextJumpToTopState(
  state: JumpToTopState,
  scrollY: number,
  viewportHeight: number
): JumpToTopState {
  const change = scrollY - state.lastScrollY
  const upwardTravel = change < 0 ? state.upwardTravel - change : 0
  const isDeep = scrollY > JUMP_TO_TOP_SCREEN_COUNT * viewportHeight
  if (!isDeep || change > 0) {
    return { lastScrollY: scrollY, upwardTravel, isVisible: false }
  }
  return {
    lastScrollY: scrollY,
    upwardTravel,
    isVisible: state.isVisible || upwardTravel >= JUMP_TO_TOP_UPWARD_TRAVEL_PX,
  }
}

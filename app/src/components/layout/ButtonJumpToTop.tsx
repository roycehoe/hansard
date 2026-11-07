import { Button } from '@/components/ui/button'
import { JUMP_TO_TOP_PHONE_LIFT_CLASS_NAME } from '@/constants/layout/constants'
import { nextJumpToTopState, type JumpToTopState } from '@/lib/jumpToTop'
import { moveFocusToPageHeading } from '@/lib/navigationFocus'
import { cn } from '@/lib/utils'
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ButtonJumpToTop() {
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(function trackScrollDepth() {
    let state: JumpToTopState = {
      lastScrollY: window.scrollY,
      upwardTravel: 0,
      isVisible: false,
    }
    function updateVisibility() {
      state = nextJumpToTopState(state, window.scrollY, window.innerHeight)
      setIsVisible(state.isVisible)
    }
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return function stopTrackingScrollDepth() {
      window.removeEventListener('scroll', updateVisibility)
    }
  }, [])

  function jumpToTop() {
    window.scrollTo(0, 0)
    moveFocusToPageHeading()
  }

  if (!isVisible) return null
  return (
    <Button
      type="button"
      variant="outline"
      size="touch"
      aria-label="Top of page"
      onClick={jumpToTop}
      className={cn(
        'fixed right-4 z-40 shadow-md sm:right-6 sm:bottom-6',
        JUMP_TO_TOP_PHONE_LIFT_CLASS_NAME
      )}
    >
      <ArrowUp />
      Top
    </Button>
  )
}

export const NAV_ITEMS = [
  { label: 'Search', to: '/search' },
  { label: 'Sittings', to: '/sittings' },
  { label: 'People', to: '/people' },
  { label: 'Coverage', to: '/coverage' },
] as const

export const JUMP_TO_TOP_SCREEN_COUNT = 2

export const JUMP_TO_TOP_UPWARD_TRAVEL_PX = 100

export const JUMP_TO_TOP_PHONE_LIFT_CLASS_NAME =
  'bottom-[calc(env(safe-area-inset-bottom,0px)_+_4.5rem)]'

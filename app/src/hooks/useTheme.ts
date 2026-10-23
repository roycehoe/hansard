import {
  DARK_SCHEME_MEDIA_QUERY,
  NO_TRANSITIONS_CSS,
  THEME_STORAGE_KEY,
} from '@/constants/appearance/constants'
import { ColourChoice } from '@/constants/appearance/enums'
import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()

function readStoredColourChoice(): ColourChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === ColourChoice.LIGHT || stored === ColourChoice.DARK) {
      return stored
    }
  } catch {
    /* storage unavailable: follow the system */
  }
  return ColourChoice.AUTOMATIC
}

let colourChoice = readStoredColourChoice()

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function readColourChoice(): ColourChoice {
  return colourChoice
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function storeColourChoice(choice: ColourChoice) {
  try {
    if (choice === ColourChoice.AUTOMATIC) {
      localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, choice)
    }
  } catch {
    /* storage unavailable: the class on <html> still applies */
  }
}

function toggleDarkClassWithoutTransitions(isDark: boolean) {
  const style = document.createElement('style')
  style.textContent = NO_TRANSITIONS_CSS
  document.head.appendChild(style)
  document.documentElement.classList.toggle('dark', isDark)
  // Forces the new colours to apply while transitions are still off, so every element switches in the same frame.
  document.body.getBoundingClientRect()
  requestAnimationFrame(() => style.remove())
}

export function setColourChoice(choice: ColourChoice) {
  colourChoice = choice
  const isDark =
    choice === ColourChoice.DARK ||
    (choice === ColourChoice.AUTOMATIC &&
      matchMedia(DARK_SCHEME_MEDIA_QUERY).matches)
  toggleDarkClassWithoutTransitions(isDark)
  storeColourChoice(choice)
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, (): Theme => 'light')
  const currentColourChoice = useSyncExternalStore(
    subscribe,
    readColourChoice,
    () => ColourChoice.AUTOMATIC
  )

  return { theme, colourChoice: currentColourChoice, setColourChoice }
}

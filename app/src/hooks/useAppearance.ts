import { APPEARANCE_STORAGE_KEY } from '@/constants/appearance/constants'
import {
  ColumnNumbers,
  ContentWidth,
  TextSize,
} from '@/constants/appearance/enums'
import { createListenerStore } from '@/lib/utils'
import { useSyncExternalStore } from 'react'

export interface Appearance {
  textSize: TextSize
  width: ContentWidth
  columnNumbers: ColumnNumbers
}

const DEFAULT_APPEARANCE: Appearance = {
  textSize: TextSize.STANDARD,
  width: ContentWidth.STANDARD,
  columnNumbers: ColumnNumbers.HIDE,
}

const appearanceStore = createListenerStore()

function pickOption<T extends string>(
  options: T[],
  candidate: unknown,
  fallback: T
): T {
  return options.find((option) => option === candidate) ?? fallback
}

function readStoredAppearance(): Appearance {
  try {
    const stored: Partial<Record<keyof Appearance, unknown>> = JSON.parse(
      localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? '{}'
    )
    return {
      textSize: pickOption(
        Object.values(TextSize),
        stored.textSize,
        DEFAULT_APPEARANCE.textSize
      ),
      width: pickOption(
        Object.values(ContentWidth),
        stored.width,
        DEFAULT_APPEARANCE.width
      ),
      columnNumbers: pickOption(
        Object.values(ColumnNumbers),
        stored.columnNumbers,
        DEFAULT_APPEARANCE.columnNumbers
      ),
    }
  } catch {
    return DEFAULT_APPEARANCE
  }
}

let appearance = readStoredAppearance()

function readAppearance(): Appearance {
  return appearance
}

function applyAppearance(next: Appearance) {
  const { dataset } = document.documentElement
  dataset.textSize = next.textSize
  dataset.width = next.width
  dataset.columns = next.columnNumbers
}

export function changeAppearance(change: Partial<Appearance>) {
  appearance = { ...appearance, ...change }
  applyAppearance(appearance)
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance))
  } catch {
    /* storage unavailable: the attributes on <html> still apply */
  }
  appearanceStore.notify()
}

export function useAppearance() {
  const current = useSyncExternalStore(
    appearanceStore.subscribe,
    readAppearance,
    () => DEFAULT_APPEARANCE
  )

  return { appearance: current, changeAppearance }
}

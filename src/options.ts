export const RENDERING_OPTIONS = [
  "normal",
  "uv",
  "festive",
  "rainbow",
  "fire",
] as const

export interface RenderOptions {
  uniforms: {
    pitch: number
  }
  rendering: (typeof RENDERING_OPTIONS)[number]
  condenseFish: boolean
  twelveHourTime: boolean
  showPixels: boolean
}

export function localStorageSync<T extends {}>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const urlParams = new URL(window.location.toString()).searchParams

  const currentValue = urlParams.has(key)
    ? urlParams.get(key)
    : localStorage.getItem(key)

  const setLocalStorage = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  if (currentValue !== null) {
    return [JSON.parse(currentValue), setLocalStorage]
  } else {
    setLocalStorage(defaultValue)
    return [defaultValue, setLocalStorage]
  }
}

export const [RENDERING_MODE, setRenderingMode] = localStorageSync<
  RenderOptions["rendering"]
>("rendering-mode", "normal")
export const [CONDENSE_FISH, setCondenseFish] = localStorageSync(
  "condense-fish",
  false
)
export const [TWELVE_HOUR, setTwelveHour] = localStorageSync(
  "twelve-hour",
  false
)
export const [SHOW_PIXELS, setShowPixels] = localStorageSync(
  "show-pixels",
  false
)

export function rotateRendering(options: RenderOptions) {
  const currentIndex = RENDERING_OPTIONS.indexOf(options.rendering)
  const newRendering =
    RENDERING_OPTIONS[(currentIndex + 1) % RENDERING_OPTIONS.length]
  setRenderingMode(newRendering)
  options.rendering = newRendering
}
export function toggleFishCondensor(options: RenderOptions) {
  options.condenseFish = !options.condenseFish
  setCondenseFish(options.condenseFish)
}
export function toggleTwelveHourTime(options: RenderOptions) {
  options.twelveHourTime = !options.twelveHourTime
  setTwelveHour(options.twelveHourTime)
}

export function toggleShowPixels(options: RenderOptions) {
  options.showPixels = !options.showPixels
  setShowPixels(options.showPixels)
}

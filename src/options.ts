export const RENDERING_OPTIONS = [
  "normal",
  "uv",
  "festive",
  "rainbow",
  "fire",
] as const

export type RenderMode = (typeof RENDERING_OPTIONS)[number]

type ValueListener<T> = (newValue: T) => void

const LOCAL_STORAGE_PREFIX = "NOW-APPROACHING-OPTION-"

export class OptionStore<T> {
  #value: T
  #listeners: ValueListener<T>[] = []

  #setLocalStorage: (value: T) => void

  constructor(key: string, defaultValue: T) {
    const urlParams = new URL(window.location.toString()).searchParams

    const currentValueString = urlParams.has(key)
      ? urlParams.get(key)!
      : localStorage.getItem(LOCAL_STORAGE_PREFIX + key)

    this.#setLocalStorage = (value: T) => {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value))
    }

    if (currentValueString !== null) {
      this.#value = JSON.parse(currentValueString)
    } else {
      this.#setLocalStorage(defaultValue)
      this.#value = defaultValue
    }
  }

  get(): T {
    return this.#value
  }

  set(newValue: T): void {
    this.#value = newValue
    this.#setLocalStorage(newValue)
    this.#listeners.forEach((listener) => {
      listener(newValue)
    })
  }

  subscribe(callback: ValueListener<T>) {
    this.#listeners.push(callback)
  }

  unsubscribe(callbackToRemove: ValueListener<T>) {
    this.#listeners = this.#listeners.filter(
      (callback) => callback !== callbackToRemove
    )
  }
}

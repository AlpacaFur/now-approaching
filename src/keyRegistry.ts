import type { RenderOptions } from "./main"

export type KeyRegistry = Record<string, () => void>

export interface KeyBinding {
  key: string
  onActivate: (options: RenderOptions) => void
  getStatus: (options: RenderOptions) => string
}

export function registerKeyButton(
  key: string,
  clickCallback: (options: RenderOptions) => void,
  getValue: (options: RenderOptions) => string,
  registry: KeyRegistry,
  regenerate: () => void,
  renderOptions: RenderOptions
) {
  const element = document.getElementById(`${key}-key`)!
  const status = element.querySelector(".status")!
  const update = () => {
    status.textContent = `(${getValue(renderOptions)})`
  }
  update()

  const press = () => {
    clickCallback(renderOptions)
    update()
    regenerate()
  }

  element.addEventListener("click", press)
  registry[key] = press
}

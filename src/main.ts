import "./main.css"
import { renderRows } from "./rendering/letter-drawing"
import { widthToChars } from "./rendering/labels"
import { generateList } from "./countdown/generateList"
import {
  registerKeyButton,
  type KeyBinding,
  type KeyRegistry,
} from "./keyRegistry"
import { newSetupRenderer } from "./renderer/adapter"
import { OptionStore, RENDERING_OPTIONS, type RenderMode } from "./options"
import { secondBasedTimer } from "./rendering/animation"

export const Options = {
  showPixels: new OptionStore("show-pixels", false),
  rendering: new OptionStore<RenderMode>("rendering-mode", "normal"),
  condenseFish: new OptionStore("condense-fish", false),
  twelveHourTime: new OptionStore("twelve-hour-time", false),
} as const

export type RenderOptions = typeof Options

if (!new URL(window.location.toString()).searchParams.has("screensaver")) {
  document.body.classList.remove("fadein")
}

const { updateTexture, getCanvas, adjustBlur, updatePitch, getWidthHeight } =
  newSetupRenderer(Options)

export function regenerate() {
  const rows = generateList(Options, getWidthHeight(), regenerate)
  renderRows(rows, updateTexture, Options)
}

function resize() {
  const { pitch } = widthToChars(...getWidthHeight())
  updatePitch(pitch)
  regenerate()
}

const keyRegistry: KeyRegistry = {}
const keyButtonBindings: KeyBinding[] = [
  {
    key: "p",
    onActivate: (options) => options.showPixels.set(!options.showPixels.get()),
    getStatus: (options) => (options.showPixels.get() ? "shown" : "hidden"),
  },
  {
    key: "r",
    onActivate: (options) => {
      const currentIndex = RENDERING_OPTIONS.indexOf(options.rendering.get())
      const newRendering =
        RENDERING_OPTIONS[(currentIndex + 1) % RENDERING_OPTIONS.length]
      options.rendering.set(newRendering)
    },
    getStatus: (options) => {
      const renderMode = options.rendering.get()
      const renderModeIndex = RENDERING_OPTIONS.indexOf(renderMode) + 1
      return `${renderMode} - ${renderModeIndex}/${RENDERING_OPTIONS.length}`
    },
  },
  {
    key: "m",
    onActivate: (options) =>
      options.condenseFish.set(!options.condenseFish.get()),
    getStatus: (options) =>
      options.condenseFish.get() ? "condensed" : "uncondensed",
  },
  {
    key: "t",
    onActivate: (options) =>
      options.twelveHourTime.set(!options.twelveHourTime.get()),
    getStatus: (options) =>
      options.twelveHourTime.get() ? "12-hour" : "24-hour",
  },
]

keyButtonBindings.forEach(({ key, onActivate, getStatus }) =>
  registerKeyButton(
    key,
    onActivate,
    getStatus,
    keyRegistry,
    regenerate,
    Options
  )
)

document.body.addEventListener("keypress", (e) => {
  if (e.key === "f") {
    if (document.fullscreenElement !== null) {
      document.exitFullscreen()
    } else {
      document.body.requestFullscreen()
    }
  } else if (keyRegistry[e.key]) {
    keyRegistry[e.key]()
  } else if (e.key === "=") adjustBlur()
  else if (e.key === "-") adjustBlur()
})

secondBasedTimer(regenerate)

const shaderContainer = document.getElementById("shader-container")!

const resizeObserver = new ResizeObserver(() => {
  resize()
})
resizeObserver.observe(shaderContainer)

resize()
shaderContainer.append(getCanvas())

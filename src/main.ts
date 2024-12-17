import "./main.css"
import { renderRows } from "./rendering/texture-drawing"
import { setupRenderer } from "./rendering/rendering"
import { widthToChars } from "./labels"
import { secondBasedTimer } from "./animation"
import {
  CONDENSE_FISH,
  RENDERING_MODE,
  RENDERING_OPTIONS,
  rotateRendering,
  SHOW_PIXELS,
  toggleFishCondensor,
  toggleShowPixels,
  toggleTwelveHourTime,
  TWELVE_HOUR,
  type RenderOptions,
} from "./options"
import { generateList } from "./generateList"
import {
  registerKeyButton,
  type KeyBinding,
  type KeyRegistry,
} from "./keyRegistry"

export const renderOptions: RenderOptions = {
  uniforms: {
    pitch: 5.0,
  },
  rendering: RENDERING_MODE,
  condenseFish: CONDENSE_FISH,
  twelveHourTime: TWELVE_HOUR,
  showPixels: SHOW_PIXELS,
}

if (!new URL(window.location.toString()).searchParams.has("screensaver")) {
  document.body.classList.remove("fadein")
}

const { updateTexture, getCanvas, adjustBlur, updatePitch, getWidthHeight } =
  setupRenderer(renderOptions)

export function regenerate() {
  const rows = generateList(renderOptions, getWidthHeight())
  renderRows(rows, updateTexture, renderOptions)
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
    onActivate: toggleShowPixels,
    getStatus: (options) => (options.showPixels ? "shown" : "hidden"),
  },
  {
    key: "r",
    onActivate: rotateRendering,
    getStatus: (options) => {
      const renderMode = options.rendering
      const renderModeIndex = RENDERING_OPTIONS.indexOf(renderMode) + 1
      return `${renderMode} - ${renderModeIndex}/${RENDERING_OPTIONS.length}`
    },
  },
  {
    key: "m",
    onActivate: toggleFishCondensor,
    getStatus: (options) =>
      options.condenseFish ? "condensed" : "uncondensed",
  },
  {
    key: "t",
    onActivate: toggleTwelveHourTime,
    getStatus: (options) => (options.twelveHourTime ? "12-hour" : "24-hour"),
  },
]

keyButtonBindings.forEach(({ key, onActivate, getStatus }) =>
  registerKeyButton(
    key,
    onActivate,
    getStatus,
    keyRegistry,
    regenerate,
    renderOptions
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
  } else if (e.key === "=") adjustBlur(1)
  else if (e.key === "-") adjustBlur(-1)
})

window.addEventListener("resize", resize)
secondBasedTimer(regenerate)
document.getElementById("shader-container")!.append(getCanvas())

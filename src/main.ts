import "./shader/shader.css"
import { renderRows } from "./shader/texture-drawing"
import { setupRenderer } from "./shader/shader"
import { DATA } from "./data"
import { minutesUntilTime, nextRealOccurrence } from "./time"
import {
  currentTimeDisplay,
  generateTimeLabel,
  NBSP,
  widthToChars,
} from "./labels"
import { secondBasedTimer } from "./animation"

if (!new URL(window.location.toString()).searchParams.has("screensaver")) {
  console.log("removing")
  document.body.classList.remove("fadein")
}

const RENDERING_OPTIONS = ["normal", "uv", "festive", "rainbow"] as const
export interface RenderConfig {
  rendering: (typeof RENDERING_OPTIONS)[number]
  rainbow: boolean
  filled: boolean
}

const renderConfig: RenderConfig = {
  rendering: "normal",
  rainbow: false,
  filled: false,
}

const {
  updateTexture,
  getCanvas,
  toggleShowPixels,
  adjustBlur,
  adjustWipe,
  updatePitch,
  rerender,
} = setupRenderer()

function regenerateList() {
  const { chars: charsThatFit, pitch } = widthToChars(window.innerWidth)
  updatePitch(pitch)

  const sortedInstances = DATA.map((entry) => {
    return entry.times
      .map((time) => ({ time, entry }))
      .map((instance) => ({
        entry: instance.entry,
        time: nextRealOccurrence(instance.time),
      }))
      .sort((a, b) => minutesUntilTime(a.time) - minutesUntilTime(b.time))[0]
  }).sort(({ time: timeA }, { time: timeB }) => {
    return minutesUntilTime(timeA) - minutesUntilTime(timeB)
  })

  const elems = sortedInstances
    .map(({ entry, time }, index) => {
      const minutesLeft = minutesUntilTime(time)
      const remainingLabel = generateTimeLabel(minutesLeft)

      if (index === 0) {
        document.title = "Next in: " + remainingLabel
      }

      // const timeLabel = timeDisplay(time)

      const remaining = charsThatFit - entry.name.length
      return entry.name + remainingLabel.padStart(remaining, NBSP)
    })
    .slice(0, 8)

  const currentTime = currentTimeDisplay()

  const shiftedTime =
    NBSP.repeat(charsThatFit - currentTime.length) + currentTime

  elems.unshift(shiftedTime)

  renderRows(elems, updateTexture, renderConfig)
}

window.addEventListener("resize", regenerateList)
regenerateList()
secondBasedTimer(regenerateList)

document.body.addEventListener("keydown", (e) => {})

document.getElementById("shader-container")!.append(getCanvas())

document.body.addEventListener("keypress", (e) => {
  if (e.key === "f") {
    if (document.fullscreenElement !== null) {
      document.exitFullscreen()
    } else {
      document.body.requestFullscreen()
    }
  } else if (e.key === "r") {
    const currentIndex = RENDERING_OPTIONS.indexOf(renderConfig.rendering)
    const newRendering =
      RENDERING_OPTIONS[(currentIndex + 1) % RENDERING_OPTIONS.length]
    renderConfig.rendering = newRendering
    rerender()
  } else if (e.key === "p") toggleShowPixels()
  else if (e.key === "=") adjustBlur(1)
  else if (e.key === "-") adjustBlur(-1)
  else if (e.key === ",") {
    updatePitch(-1)
    regenerateList()
  } else if (e.key === ".") {
    updatePitch(1)
    regenerateList()
  }
})

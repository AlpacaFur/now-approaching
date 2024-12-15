import "./shader/shader.css"
import { renderRows, TextBlock } from "./shader/texture-drawing"
import { setupRenderer } from "./shader/shader"
import { DATA } from "./data"
import { minutesUntilTime, nextRealOccurrence } from "./time"
import {
  currentTimeDisplay,
  generateTimeLabel,
  NBSP,
  timeDisplay,
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

  const elems: TextBlock[][] = sortedInstances
    .map(({ entry, time }, index): TextBlock[] => {
      const minutesLeft = minutesUntilTime(time)
      const remainingLabel = generateTimeLabel(minutesLeft).padStart(6, " ")
      const timeLabel = timeDisplay(time).padStart(6, " ")

      if (index === 0) {
        document.title = "Next in: " + remainingLabel
      }

      const remaining = charsThatFit - entry.name.length - remainingLabel.length

      const active = remainingLabel.endsWith("BRD")
      return [
        {
          content: entry.name,
          hoverable: true,
          active,
          onClick: () => openURL(entry.url),
        },
        { content: " ".repeat(remaining), active },
        {
          content: remainingLabel,
          hoverable: true,
          hoverContent: timeLabel,
          active,
        },
      ]
      // return entry.name + remainingLabel.padStart(remaining, NBSP)
    })
    .slice(0, 8)

  const currentTime = currentTimeDisplay()

  const timeShift = NBSP.repeat(charsThatFit - currentTime.length)

  elems.unshift([{ content: timeShift }, { content: currentTime }])

  renderRows(elems, updateTexture, renderConfig)
}

function openURL(url: string) {
  window.open(url, "_blank")
}

window.addEventListener("resize", regenerateList)
regenerateList()
secondBasedTimer(regenerateList)

document.body.addEventListener("keydown", () => {})

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

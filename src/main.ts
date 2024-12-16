import "./main.css"
import { renderRows, TextBlock } from "./shader/texture-drawing"
import { localStorageSync, setupRenderer } from "./shader/shader"
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

const keyRegistry: Record<string, () => void> = {}

if (!new URL(window.location.toString()).searchParams.has("screensaver")) {
  document.body.classList.remove("fadein")
}

const RENDERING_OPTIONS = ["normal", "uv", "festive", "rainbow"] as const
export interface RenderConfig {
  rendering: (typeof RENDERING_OPTIONS)[number]
  condenseFish: boolean
  twelveHourTime: boolean
}

const [RENDERING_MODE, setRenderingMode] = localStorageSync<
  RenderConfig["rendering"]
>("rendering-mode", "normal")

const [CONDENSE_FISH, setCondenseFish] = localStorageSync(
  "condense-fish",
  false
)

const [TWELVE_HOUR, setTwelveHour] = localStorageSync("twelve-hour", false)

const renderConfig: RenderConfig = {
  rendering: RENDERING_MODE,
  condenseFish: CONDENSE_FISH,
  twelveHourTime: TWELVE_HOUR,
}

const {
  updateTexture,
  getCanvas,
  toggleShowPixels,
  pixelsShown,
  adjustBlur,
  updatePitch,
  rerender,
  getWidthHeight,
} = setupRenderer()

function regenerateList() {
  const { chars: charsThatFit, pitch } = widthToChars(...getWidthHeight())
  updatePitch(pitch)

  const filteredData = DATA.filter((entry) => {
    if (renderConfig.condenseFish) {
      return entry.condensible !== true
    } else {
      return entry.condensor !== true
    }
  })

  const sortedInstances = filteredData
    .map((entry) => {
      return entry.times
        .map((time) => ({ time, entry }))
        .map((instance) => ({
          entry: instance.entry,
          time: nextRealOccurrence(instance.time),
        }))
        .sort((a, b) => minutesUntilTime(a.time) - minutesUntilTime(b.time))[0]
    })
    .sort(({ time: timeA }, { time: timeB }) => {
      return minutesUntilTime(timeA) - minutesUntilTime(timeB)
    })

  const elems: TextBlock[][] = sortedInstances
    .map(({ entry, time }, index): TextBlock[] => {
      const minutesLeft = minutesUntilTime(time)
      const remainingLabel = generateTimeLabel(minutesLeft).padStart(6, " ")
      const timeLabel = timeDisplay(time, renderConfig.twelveHourTime).padStart(
        6,
        " "
      )

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
          onClick: () => {
            window.location.hash = entry.slug
          },
          active,
        },
      ]
      // return entry.name + remainingLabel.padStart(remaining, NBSP)
    })
    .slice(0, 8)

  const currentTime = currentTimeDisplay(renderConfig.twelveHourTime)

  const timeShift = NBSP.repeat(charsThatFit - currentTime.length)

  elems.unshift([
    { content: timeShift },
    { content: currentTime, onClick: toggleTwelveHourTime },
  ])

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
  } else if (keyRegistry[e.key]) {
    keyRegistry[e.key]()
  } else if (e.key === "=") adjustBlur(1)
  else if (e.key === "-") adjustBlur(-1)
  else if (e.key === ",") {
    // updatePitch(-1)
    // regenerateList()
  } else if (e.key === ".") {
    // updatePitch(1)
    // rerender()
  }
})

function rotateRendering() {
  const currentIndex = RENDERING_OPTIONS.indexOf(renderConfig.rendering)
  const newRendering =
    RENDERING_OPTIONS[(currentIndex + 1) % RENDERING_OPTIONS.length]
  setRenderingMode(newRendering)
  renderConfig.rendering = newRendering
  rerender()
}

function toggleFishCondensor() {
  renderConfig.condenseFish = !renderConfig.condenseFish
  setCondenseFish(renderConfig.condenseFish)
  regenerateList()
}

function toggleTwelveHourTime() {
  renderConfig.twelveHourTime = !renderConfig.twelveHourTime
  setTwelveHour(renderConfig.twelveHourTime)
  regenerateList()
}

function registerKeyButton(
  key: string,
  clickCallback: () => void,
  getValue: () => string
) {
  const element = document.getElementById(`${key}-key`)!
  const status = element.querySelector(".status")!
  const update = () => {
    status.textContent = `(${getValue()})`
  }
  update()

  const press = () => {
    clickCallback()
    update()
  }

  element.addEventListener("click", press)
  keyRegistry[key] = press
}

registerKeyButton("p", toggleShowPixels, () =>
  pixelsShown() ? "shown" : "hidden"
)
registerKeyButton("r", rotateRendering, () => renderConfig.rendering)
registerKeyButton("m", toggleFishCondensor, () =>
  renderConfig.condenseFish ? "condensed" : "uncondensed"
)
registerKeyButton("t", toggleTwelveHourTime, () =>
  renderConfig.twelveHourTime ? "12-hour" : "24-hour"
)

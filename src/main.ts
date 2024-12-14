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

export interface RenderConfig {
  rainbow: boolean
  filled: boolean
}

const renderConfig: RenderConfig = {
  rainbow: false,
  filled: false,
}

const {
  updateTexture,
  getCanvas,
  toggleShowPixels,
  adjustBlur,
  adjustWipe,
  rerender,
} = setupRenderer()

function regenerateList() {
  const charWidth = widthToChars(window.innerWidth)

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

      const remaining = charWidth - entry.name.length
      return entry.name + remainingLabel.padStart(remaining, NBSP)
    })
    .slice(0, 7)

  const currentTime = currentTimeDisplay()

  const shiftedTime = NBSP.repeat(charWidth - currentTime.length) + currentTime

  elems.unshift(shiftedTime)

  console.log(elems)

  renderRows(elems, updateTexture, renderConfig)
  // const container = document.getElementById("container")!
  // container.replaceChildren(...elems)
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
    renderConfig.rainbow = !renderConfig.rainbow
    rerender()
  } else if (e.key === "p") toggleShowPixels()
  else if (e.key === "=") adjustBlur(1)
  else if (e.key === "-") adjustBlur(-1)
  else if (e.key === ",") adjustWipe(-1)
  else if (e.key === ".") adjustWipe(1)
})

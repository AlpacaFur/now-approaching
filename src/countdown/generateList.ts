import { DATA } from "./data"
import {
  widthToChars,
  generateTimeLabel,
  timeDisplay,
  currentTimeDisplay,
} from "../rendering/labels"
import type { RenderOptions } from "../main"
import type { TextRow } from "../rendering/letter-drawing"
import { nextRealOccurrence, minutesUntilTime } from "./time"

function openURL(url: string, blank: boolean = true) {
  if (blank) {
    window.open(url, "_blank")
  } else {
    window.location.assign(url)
  }
}

export function generateList(
  renderOptions: RenderOptions,
  canvasDimensions: [number, number],
  regenerate: () => void
): TextRow[] {
  const { chars: charsThatFit } = widthToChars(...canvasDimensions)

  const filteredData = DATA.filter((entry) => {
    if (renderOptions.condenseFish.get()) {
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

  const elems: TextRow[] = sortedInstances
    .map(({ entry, time }, index): TextRow => {
      const minutesLeft = minutesUntilTime(time)
      const remainingLabel = generateTimeLabel(minutesLeft).padStart(6, " ")
      const timeLabel = timeDisplay(
        time,
        renderOptions.twelveHourTime.get()
      ).padStart(6, " ")

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
          onClick: renderOptions.useVantage.get()
            ? () => openURL(`/camera-mode?site=${entry.slug}`, false)
            : () => openURL(entry.url),
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
    })
    .slice(0, 8)

  const currentTime = currentTimeDisplay(renderOptions.twelveHourTime.get())

  const timeShift = " ".repeat(charsThatFit - currentTime.length)

  elems.unshift([
    { content: timeShift },
    {
      content: currentTime,
      onClick: () => {
        renderOptions.twelveHourTime.set(!renderOptions.twelveHourTime.get())
        regenerate()
      },
    },
  ])

  return elems
}

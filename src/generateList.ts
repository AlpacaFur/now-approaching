import { DATA } from "./data"
import {
  widthToChars,
  generateTimeLabel,
  timeDisplay,
  currentTimeDisplay,
} from "./labels"
import { type RenderOptions, toggleTwelveHourTime } from "./options"
import type { TextRow } from "./rendering/texture-drawing"
import { nextRealOccurrence, minutesUntilTime } from "./time"

function openURL(url: string) {
  window.open(url, "_blank")
}

export function generateList(
  renderOptions: RenderOptions,
  canvasDimensions: [number, number]
): TextRow[] {
  const { chars: charsThatFit } = widthToChars(...canvasDimensions)

  const filteredData = DATA.filter((entry) => {
    if (renderOptions.condenseFish) {
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
        renderOptions.twelveHourTime
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
    })
    .slice(0, 8)

  const currentTime = currentTimeDisplay(renderOptions.twelveHourTime)

  const timeShift = " ".repeat(charsThatFit - currentTime.length)

  elems.unshift([
    { content: timeShift },
    {
      content: currentTime,
      onClick: () => toggleTwelveHourTime(renderOptions),
    },
  ])

  return elems
}

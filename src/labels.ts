import { LETTER_WIDTH_WITH_GAP } from "./shader/texture-drawing"
import { StandardTime } from "./time"

export const NBSP = " "

export function generateTimeLabel(minutes: number) {
  const seconds = new Date().getSeconds()
  if (minutes === 0) {
    return "BRD"
  }
  if (minutes === 1 && seconds >= 45) {
    return "ARR"
  }
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)

  if (hours > 9) {
    return `${hours} hrs`
  }

  const mins = minutes - hours * 60
  return `${hours}h ${mins}m`
}

export function widthToChars(
  width: number,
  height: number
): { chars: number; pitch: number } {
  const breakPoints = [
    [0, 0, 1],
    [350, 280, 1.1],
    [460, 370, 1.5],
    [650, 530, 2],
    [850, 680, 3],
    [1050, 840, 4],
    [Infinity, Infinity, 5],
  ]

  const breakPointIndex = breakPoints.findIndex(([minWidth, minHeight]) => {
    if (width < minWidth || height < minHeight) return true
    else return false
  })

  const pitch = breakPoints[breakPointIndex][2]

  const pixelsPerChar = pitch * LETTER_WIDTH_WITH_GAP
  const charsThatFit = Math.floor((width - 40) / pixelsPerChar)

  return { chars: Math.min(charsThatFit, 24), pitch }
}

export function currentTimeDisplay(): string {
  const now = new Date()
  return timeDisplay({
    hour: now.getHours(),
    min: now.getMinutes(),
  })
}

export function timeDisplay(time: StandardTime): string {
  return `${time.hour}:${String(time.min).padStart(2, "0")}`
}

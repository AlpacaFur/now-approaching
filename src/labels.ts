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

export function widthToChars(width: number): number {
  const breakPoints = [
    [0, 24],
    [600, 40],
    [800, 56],
    [1000, 70],
    [Infinity, 80],
  ]

  const breakPointIndex = breakPoints.findIndex(([minWidth]) => {
    if (width < minWidth) return true
    else return false
  })

  const fontSize = breakPoints[breakPointIndex - 1][1]

  const pixelsPerChar = fontSize / 1.5
  const charsThatFit = Math.floor((width - 40) / pixelsPerChar)

  return Math.min(charsThatFit, 24)
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

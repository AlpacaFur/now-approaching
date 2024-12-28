import { LETTER_WIDTH_WITH_GAP } from "./letter-drawing"
import { StandardTime } from "../countdown/time"

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
    [650, 530, 2.1],
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

  return { chars: Math.max(19, Math.min(charsThatFit, 24)), pitch }
}

export function currentTimeDisplay(twelveHour: boolean): string {
  const now = new Date()
  return timeDisplay(
    {
      hour: now.getHours(),
      min: now.getMinutes(),
    },
    twelveHour
  )
}

function hourToTwelveHour(hour: number): number {
  if (hour === 0) return 12
  else if (hour < 13) return hour
  else return (hour % 13) + 1
}

function getAMPM(hour: number): string {
  if (hour < 12) return "a"
  return "p"
}

export function timeDisplay(time: StandardTime, twelveHour: boolean): string {
  if (twelveHour) {
    const hour = hourToTwelveHour(time.hour)
    const minute = time.min.toString().padStart(2, "0")
    return `${hour}:${minute}${getAMPM(time.hour)}`
  } else {
    return `${time.hour.toString().padStart(2, "0")}:${String(
      time.min
    ).padStart(2, "0")}`
  }
}

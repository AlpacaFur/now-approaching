export type Time = StandardTime | WildcardTime

export interface WildcardTime {
  type: "wildcard"
  hour: "*"
  min: number
}

export interface StandardTime {
  hour: number
  min: number
}

export function minutesUntilTime(time: StandardTime): number {
  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()

  const dayOffset =
    currentHour > time.hour ||
    (currentHour === time.hour && currentMinute > time.min)
      ? 60 * 24
      : 0

  return dayOffset + (time.hour - currentHour) * 60 + (time.min - currentMinute)
}

export function nextRealOccurrence(time: Time): StandardTime {
  if (time.hour === "*") {
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()

    if (currentMinute <= time.min) {
      return {
        hour: currentHour,
        min: time.min,
      }
    } else {
      return {
        hour: (currentHour + 1) % 24,
        min: time.min,
      }
    }
  } else {
    return time
  }
}

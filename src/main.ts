import "./style.css"

if (!new URL(window.location.toString()).searchParams.has("screensaver")) {
  console.log("removing")
  document.body.classList.remove("fadein")
}
interface StandardTime {
  hour: number
  min: number
}

interface WildcardTime {
  type: "wildcard"
  hour: "*"
  min: number
}

type Time = StandardTime | WildcardTime

interface Entry {
  name: string
  url: string
  times: Time[]
}

const data: Entry[] = [
  {
    name: "Dial a Fish",
    url: "https://queercomputerclub.ca/projects/quecey-voip/",
    times: [
      {
        type: "wildcard",
        hour: "*",
        min: 11,
      },
    ],
  },
  {
    name: "Spin a Fish",
    url: "https://fish.lftq.in",
    times: [
      {
        hour: 11,
        min: 11,
      },
      {
        hour: 23,
        min: 11,
      },
    ],
  },
  {
    name: "Make a Fish",
    url: "http://makea.fish",
    times: [
      {
        hour: 11,
        min: 11,
      },
      {
        hour: 23,
        min: 11,
      },
    ],
  },
  {
    name: "SSH a Fissh",
    url: "https://fissh.breq.dev",
    times: [
      {
        hour: 11,
        min: 11,
      },
      {
        hour: 23,
        min: 11,
      },
    ],
  },
  {
    name: "X11:11 a Fish",
    url: "https://miakizz.quest/xfish",
    times: [
      {
        hour: 11,
        min: 11,
      },
      {
        hour: 23,
        min: 11,
      },
    ],
  },
  {
    name: "Bake a Dish",
    url: "https://tris.fyi/dish/",
    times: [
      {
        hour: 22,
        min: 22,
      },
    ],
  },
  {
    name: "Make a Byte",
    url: "https://makeabyte.lftq.in",
    times: [
      {
        hour: 2,
        min: 55,
      },
      {
        hour: 14,
        min: 55,
      },
    ],
  },
]

function nextRealOccurrence(time: Time): StandardTime {
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

function minutesUntilTime(time: StandardTime): number {
  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()

  const dayOffset =
    currentHour > time.hour ||
    (currentHour === time.hour && currentMinute > time.min)
      ? 60 * 24
      : 0

  return dayOffset + (time.hour - currentHour) * 60 + (time.min - currentMinute)
}

function generateTimeLabel(minutes: number) {
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

function widthToChars(width: number): number {
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

function currentTimeDisplay(): string {
  const now = new Date()
  return timeDisplay({
    hour: now.getHours(),
    min: now.getMinutes(),
  })
}

function timeDisplay(time: StandardTime): string {
  return `${time.hour}:${String(time.min).padStart(2, "0")}`
}

const NBSP = "\u00A0"

function regenerateList() {
  const charWidth = widthToChars(window.innerWidth)

  const sortedInstances = data
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

  const elems = sortedInstances.map(({ entry, time }, index) => {
    const p = document.createElement("p")
    const a = document.createElement("a")
    a.href = entry.url
    a.target = "_blank"
    a.textContent = entry.name

    const minutesLeft = minutesUntilTime(time)
    const remainingLabel = generateTimeLabel(minutesLeft)

    if (index === 0) {
      document.title = "Next in: " + remainingLabel
    }

    const timeLabel = timeDisplay(time)

    const remaining = charWidth - entry.name.length

    const wrapperSpan = document.createElement("span")
    wrapperSpan.classList.add("switch-wrapper")

    const timeUntil = document.createElement("span")
    timeUntil.textContent = remainingLabel.padStart(remaining, NBSP)

    const timeAt = document.createElement("span")
    timeAt.textContent = timeLabel.padStart(remaining, NBSP)

    wrapperSpan.append(timeUntil, timeAt)

    p.append(a, wrapperSpan)

    return p
  })

  const currentTime = currentTimeDisplay()

  const timeElem = document.createElement("p")
  timeElem.textContent =
    "\u00A0".repeat(charWidth - currentTime.length) + currentTime

  elems.unshift(timeElem)

  const container = document.getElementById("container")!
  container.replaceChildren(...elems)
}

function secondBasedTimer(callback: () => void) {
  callback()
  const timeout = 1000 - new Date().getMilliseconds()
  setTimeout(() => secondBasedTimer(callback), timeout)
}

window.addEventListener("resize", regenerateList)
regenerateList()
secondBasedTimer(regenerateList)

document.body.addEventListener("keypress", (e) => {
  if (e.key === "f") {
    if (document.fullscreenElement !== null) {
      document.exitFullscreen()
    } else {
      document.body.requestFullscreen()
    }
  }
})

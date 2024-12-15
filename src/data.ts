import { Time } from "./time"

interface Entry {
  name: string
  url: string
  times: Time[]
}

export const DATA: Entry[] = [
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
    name: "Make a Wiish",
    url: "http://wiish.bramdj.dev",
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
  {
    name: "Make a Seq.",
    url: "https://sequence.breq.dev",
    times: [
      {
        hour: 12,
        min: 34,
      },
    ],
  },
]

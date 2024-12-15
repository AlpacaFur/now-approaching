import { Time } from "./time"

export interface Author {
  name: string
  url: string
}

interface Entry {
  name: string
  description?: string
  authors?: Author[]
  longName?: string
  condensible?: boolean
  condensor?: boolean
  url: string
  slug: string
  times: Time[]
}

const brooke: Author = {
  name: "Brooke",
  url: "https://breq.dev",
}
const luke: Author = {
  name: "Luke",
  url: "https://lukefelixtaylor.com",
}

export const DATA: Entry[] = [
  {
    name: "Make a Seq.",
    longName: "Make a Sequence",
    slug: "make-a-sequence",
    url: "https://sequence.breq.dev",
    description: "See a random OEIS integer sequence!",
    authors: [brooke],
    times: [
      {
        hour: 0,
        min: 34,
      },
      {
        hour: 12,
        min: 34,
      },
    ],
  },
  {
    name: "Make a Byte",
    slug: "make-a-byte",
    url: "https://makeabyte.lftq.in",
    description:
      "See a random byte value with different interpretations including ASCII, binary, and 6502 opcode.",
    authors: [luke, brooke],
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
    name: "Dial a Fish",
    slug: "dial-a-fish",
    url: "https://queercomputerclub.ca/projects/quecey-voip/",
    description: "Fish image via SSTV over a phone call!",
    authors: [
      {
        name: "Ari",
        url: "https://adryd.com/",
      },
      {
        name: "Blackle",
        url: "https://suricrasia.online/",
      },
    ],
    times: [
      {
        type: "wildcard",
        hour: "*",
        min: 11,
      },
    ],
  },
  {
    name: "Make a Fish",
    slug: "make-a-fish",
    url: "http://makea.fish",
    condensible: true,
    description:
      "The original site that sparked it all! Makes a random patterned fish. HTTP only.",
    authors: [
      {
        name: "Willow",
        url: "https://weepingwitch.github.io/",
      },
    ],
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
    slug: "ssh-a-fissh",
    url: "https://fissh.breq.dev",
    condensible: true,
    description: "Get an ASCII art fish via an SSH connection!",
    authors: [
      brooke,
      {
        name: "Ava",
        url: "https://avasilver.dev/",
      },
    ],
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
    name: "Spin a Fish",
    slug: "spin-a-fish",
    url: "https://fish.lftq.dev",
    condensible: true,
    description: "A random, spinnable, Minecraft-style 3D fish.",
    authors: [luke],
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
    name: "Make 3 Fish",
    longName: "Fish Multiplexer",
    slug: "fish-multiplex",
    condensor: true,
    url: "https://fishmultiplex.lftq.dev",
    description:
      "Get the Make a Fish, SSH a Fish, and Spin a Fish all in one site.",
    authors: [luke],
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
    slug: "make-a-wiish",
    url: "https://wiish.bramdj.dev",
    description: "Catch a random fish from Wii Play Fishing!",
    authors: [
      {
        name: "Bram",
        url: "https://bramdj.dev",
      },
    ],
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
    longName: "X11:11 Make a Fish",
    slug: "x1111-a-fish",
    url: "https://miakizz.quest/xfish",
    description: "Connect your X11 server and see a drawn fish image!",
    authors: [
      {
        name: "Mia",
        url: "https://miakizz.quest/",
      },
    ],
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
    slug: "bake-a-dish",
    url: "https://tris.fyi/dish/",
    description: "See a random baked dish recipe!",
    authors: [
      {
        name: "Tris",
        url: "https://tris.fyi/",
      },
    ],
    times: [
      {
        hour: 22,
        min: 22,
      },
    ],
  },
]

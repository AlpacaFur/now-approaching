import { CHARS, FONT } from "../../font/font"
import { base64ToBinary } from "../../font/helpers"
import "./grid.css"

const SKEW = 5
const CELL_SIZE = 0.8 * SKEW
const GAP = SKEW - CELL_SIZE

const LETTER_WIDTH = 9
const LETTER_WIDTH_WITH_SPACE = LETTER_WIDTH + 1
const LETTER_HEIGHT = 15
const LETTER_HEIGHT_WITH_SPACE = LETTER_HEIGHT + 1

function initializeBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  context.fillStyle = "#1a1a1a"

  for (let x = 0; x < width / SKEW; x += 1) {
    for (let y = 0; y < height / SKEW; y += 1) {
      context.fillRect(x * SKEW + GAP, y * SKEW + GAP, CELL_SIZE, CELL_SIZE)
    }
  }
}

export function pickRandom(array: string[], bias?: number) {
  if (bias !== undefined) {
    return array[Math.floor(((Math.random() + bias * 3) / 4) * array.length)]
  } else {
    return array[Math.floor(Math.random() * array.length)]
  }
}

function xorshift(number: number) {
  let newNum = number
  newNum ^= newNum << 13
  newNum ^= newNum >> 17
  return newNum
}

function drawLetterPixel(
  context: CanvasRenderingContext2D,
  letterX: number,
  letterY: number,
  localX: number,
  localY: number
) {
  const realX = (letterX * LETTER_WIDTH_WITH_SPACE + localX) * SKEW
  const realY = (letterY * LETTER_HEIGHT_WITH_SPACE + localY) * SKEW
  const randomishFloat = (xorshift(realX * 419 + realY) % 255) / 255
  const index = Math.floor(randomishFloat * 3)
  const color = ["#0f0", "#f00", "#00f"][index]
  // const color = "orange"
  context.fillStyle = color
  context.filter = `drop-shadow(0px 0px 2px ${color})`
  context.beginPath()
  context.fillRect(realX + GAP, realY + GAP, CELL_SIZE, CELL_SIZE)
  context.fill()
}

function drawLetter(
  context: CanvasRenderingContext2D,
  letter: keyof typeof FONT,
  letterX: number,
  letterY: number,
  invert: boolean = false,
  fillSides: boolean = false
) {
  const letterBinary = base64ToBinary(FONT[letter], LETTER_WIDTH, LETTER_HEIGHT)

  for (let index = 0; index < letterBinary.length; index += 1) {
    if (
      (letterBinary[index] === 1 && !invert) ||
      (letterBinary[index] === 0 && invert)
    ) {
      const localX = index % LETTER_WIDTH
      const localY = Math.floor(index / LETTER_WIDTH)
      drawLetterPixel(context, letterX, letterY, localX, localY)
    }
  }
  if (fillSides) {
    for (let y = 0; y < LETTER_HEIGHT; y += 1) {
      drawLetterPixel(context, letterX, letterY, -1, y)
      drawLetterPixel(context, letterX, letterY, LETTER_WIDTH, y)
    }
    for (let x = -1; x < LETTER_WIDTH + 1; x += 1) {
      drawLetterPixel(context, letterX, letterY, x, -1)
      drawLetterPixel(context, letterX, letterY, x, LETTER_HEIGHT)
    }
  }
}

function initializeForeground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  context.fillStyle = "orange"

  const cellsWide = width / SKEW
  const cellsTall = height / SKEW

  // // const realMessage = "ABCDEFGHIJKLMNOPQR"
  // const realMessage = Math.random().toString()
  // for (let letter = 0; letter < realMessage.length; letter += 1) {
  //   drawLetter(context, realMessage[letter], letter, 5, true, true)
  // }

  for (
    let letterX = 0;
    letterX < cellsWide / LETTER_WIDTH_WITH_SPACE;
    letterX += 1
  ) {
    for (
      let letterY = 0;
      letterY < cellsTall / LETTER_HEIGHT_WITH_SPACE;
      letterY += 1
    ) {
      const randomLetter = CHARS[Math.floor(Math.random() * CHARS.length)]
      drawLetter(context, randomLetter, letterX, letterY, true, true)
    }
  }
}

const foreground = document.getElementById("foreground") as HTMLCanvasElement
const context = foreground.getContext("2d")!

let imageData = initialize()

function initialize(): ImageData {
  const rect = foreground.parentElement!.getBoundingClientRect()
  foreground.height = rect.height
  foreground.width = rect.width

  initializeBackground(context, rect.width, rect.height)
  return context.getImageData(0, 0, rect.width, rect.height)
}

function rerender() {
  const rect = foreground.parentElement!.getBoundingClientRect()
  context.reset()
  context.putImageData(imageData, 0, 0)
  initializeForeground(context, rect.width, rect.height)
}

document.body.addEventListener("keydown", (e) => {
  if (e.key === "r") rerender()
})

window.addEventListener("resize", () => {
  imageData = initialize()
})

initialize()
rerender()

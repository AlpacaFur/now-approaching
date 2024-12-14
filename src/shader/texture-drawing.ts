import "./shader.css"
import { CHAR, FONT } from "../font/font"
import { base64ToBinary } from "../font/helpers"
import { Updater } from "./shader"
import { RenderConfig } from "../main"

const COLOR = [252, 140, 42]

const LETTER_WIDTH = 9
const LETTER_WIDTH_WITH_GAP = LETTER_WIDTH + 1
const LETTER_HEIGHT = 15
const LETTER_HEIGHT_WITH_GAP = LETTER_HEIGHT + 1

function drawLetterOntoGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  letter: CHAR,
  x: number,
  y: number,
  invert: boolean = false,
  borders: boolean = false,
  rainbow: boolean = false
) {
  const binary = base64ToBinary(FONT[letter], LETTER_WIDTH, LETTER_HEIGHT)

  for (let bitIndex = 0; bitIndex < binary.length; bitIndex += 1) {
    const bit = binary[bitIndex]
    if (!((bit === 0 && invert) || (bit === 1 && !invert))) {
      continue
    }

    const localX = bitIndex % LETTER_WIDTH
    const localY = Math.floor(bitIndex / LETTER_WIDTH)

    const realX = x + localX
    const realY = height - (y + localY) - 1

    drawPixelOnGrid(data, width, height, realX, realY, rainbow)
  }

  if (invert && borders) {
    for (let localX = -1; localX < LETTER_WIDTH_WITH_GAP; localX += 1) {
      const realX = x + localX
      const realYTop = height - (y - 1) - 1
      const realYBottom = height - (y + LETTER_HEIGHT) - 1
      drawPixelOnGrid(data, width, height, realX, realYTop, rainbow)
      drawPixelOnGrid(data, width, height, realX, realYBottom, rainbow)
    }
    for (let localY = -1; localY < LETTER_HEIGHT_WITH_GAP; localY += 1) {
      const realXLeft = x - 1
      const realXRight = x + LETTER_WIDTH
      const realY = height - (y + localY) - 1
      drawPixelOnGrid(data, width, height, realXLeft, realY, rainbow)
      drawPixelOnGrid(data, width, height, realXRight, realY, rainbow)
    }
  }
}

function drawPixelOnGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  rainbow: boolean
) {
  const pixelIndex = (y * width + x) * 4

  if (rainbow) {
    data[pixelIndex] = 255 - (x / width) * 255
    data[pixelIndex + 1] = 255 - (y / height) * 255
    data[pixelIndex + 2] = (y / height) * 255
  } else {
    data[pixelIndex] = COLOR[0]
    data[pixelIndex + 1] = COLOR[1]
    data[pixelIndex + 2] = COLOR[2]
  }
}

export const renderRows = (
  rows: string[],
  updateTexture: (updater: Updater) => void,
  renderConfig: RenderConfig
) => {
  updateTexture((data, width, height) => {
    rows.forEach((string, y) => {
      string.split("").forEach((char, x) => {
        drawLetterOntoGrid(
          data,
          width,
          height,
          char as CHAR,
          5 + LETTER_WIDTH_WITH_GAP * x,
          20 + (LETTER_HEIGHT_WITH_GAP + 2) * y,
          renderConfig.filled,
          true,
          renderConfig.rainbow
        )
      })
    })
  })
}

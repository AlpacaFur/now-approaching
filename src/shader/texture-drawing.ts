import "./shader.css"
import { CHAR, FONT } from "../font/font"
import { base64ToBinary } from "../font/helpers"
import { Updater } from "./shader"
import { RenderConfig } from "../main"

const COLOR = [252, 140, 42]

const LETTER_WIDTH = 9
export const LETTER_WIDTH_WITH_GAP = LETTER_WIDTH + 1
const LETTER_HEIGHT = 15
const LETTER_HEIGHT_WITH_GAP = LETTER_HEIGHT + 1
const LETTER_HEIGHT_WITH_LINE = LETTER_HEIGHT_WITH_GAP + 2

function drawLetterOntoGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  letter: CHAR,
  x: number,
  y: number,
  rendering: Rendering | false = false
) {
  const invert = rendering && rendering.invert === true

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

    drawPixelOnGrid(data, width, height, realX, realY, rendering)
  }

  if (invert) {
    for (let localX = -1; localX < LETTER_WIDTH_WITH_GAP; localX += 1) {
      const realX = x + localX
      const realYTop = height - (y - 1) - 1
      const realYBottom = height - (y + LETTER_HEIGHT) - 1
      drawPixelOnGrid(data, width, height, realX, realYTop, rendering)
      drawPixelOnGrid(data, width, height, realX, realYBottom, rendering)
    }
    for (let localY = -1; localY < LETTER_HEIGHT_WITH_GAP; localY += 1) {
      const realXLeft = x - 1
      const realXRight = x + LETTER_WIDTH
      const realY = height - (y + localY) - 1
      drawPixelOnGrid(data, width, height, realXLeft, realY, rendering)
      drawPixelOnGrid(data, width, height, realXRight, realY, rendering)
    }
  }
}

function drawPixelOnGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  rendering: Rendering | false
) {
  const pixelIndex = (y * width + x) * 4

  if (rendering) {
    if (rendering.type === "uv") {
      const { left, top, width, height } = rendering.boundingBox
      const offsetX = x - left
      const offsetY = y - top
      data[pixelIndex] = 255 - (offsetX / width) * 255
      data[pixelIndex + 1] = 255 - (offsetY / height) * 255
      data[pixelIndex + 2] = (offsetY / height) * 255
    } else if (rendering.type === "color") {
      data[pixelIndex] = rendering.color[0]
      data[pixelIndex + 1] = rendering.color[1]
      data[pixelIndex + 2] = rendering.color[2]
    }
  } else {
    data[pixelIndex] = COLOR[0]
    data[pixelIndex + 1] = COLOR[1]
    data[pixelIndex + 2] = COLOR[2]
  }
}

interface RenderingBase {
  invert?: boolean
}

interface BoundingBox extends RenderingBase {
  top: number
  left: number
  width: number
  height: number
}

interface Rainbow extends RenderingBase {
  type: "uv"
  boundingBox: BoundingBox
}

interface Color extends RenderingBase {
  type: "color"
  color: [number, number, number]
}

type Rendering = Rainbow | Color

interface LetterProperties {
  xOrigin: number
  yOrigin: number
  rowsHeight: number
  rowsWidth: number
  x: number
  y: number
}

const CASCADE_COLORS: Array<[number, number, number]> = [
  [255, 80, 100],
  [255, 128, 60],
  [180, 153, 50],
  [121, 180, 90],
  [80, 180, 215],
  [80, 138, 247],
  [100, 108, 247],
  [160, 100, 253],
  [210, 90, 160],
]

function determineRendering(
  rendering: RenderConfig["rendering"],
  { xOrigin, yOrigin, rowsHeight, rowsWidth, y }: LetterProperties
): Rendering | false {
  if (rendering === "uv") {
    return {
      type: "uv",
      boundingBox: {
        left: xOrigin,
        top: yOrigin,
        height: rowsHeight,
        width: rowsWidth,
      },
    }
  } else if (rendering === "festive") {
    if (y === 0) {
      return {
        type: "color",
        color: [255, 255, 255],
      }
    }
    return {
      type: "color",
      color: y % 2 === 0 ? [255, 40, 40] : [40, 255, 40],
    }
  } else if (rendering === "rainbow") {
    return {
      type: "color",
      color: CASCADE_COLORS[y] ?? [255, 255, 255],
    }
  } else {
    return false
  }
}

export const renderRows = (
  rows: string[],
  updateTexture: (updater: Updater) => void,
  renderConfig: RenderConfig
) => {
  updateTexture((data, width, height) => {
    const rowsHeight = rows.length * LETTER_HEIGHT_WITH_LINE - 2
    const rowsWidth =
      Math.max(...rows.map((string) => string.length)) * LETTER_WIDTH_WITH_GAP
    const xOrigin = Math.floor((width - rowsWidth) / 2)
    const yOrigin = Math.floor((height - rowsHeight) / 2)

    rows.forEach((string, y) => {
      string.split("").forEach((char, x) => {
        drawLetterOntoGrid(
          data,
          width,
          height,
          char as CHAR,
          xOrigin + LETTER_WIDTH_WITH_GAP * x,
          yOrigin + LETTER_HEIGHT_WITH_LINE * y,
          determineRendering(renderConfig.rendering, {
            xOrigin,
            yOrigin,
            rowsHeight,
            rowsWidth,
            x,
            y,
          })
        )
      })
    })
  })
}

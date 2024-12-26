import { CHAR, FONT } from "../font/font"
import { base64ToBinary } from "../font/helpers"
import type { RenderOptions } from "../main"
import type { RenderMode } from "../options"

export type Updater = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  hitIndex: number | false
) => ClickBox[] | undefined

const COLOR = [252, 140, 42]

const LETTER_WIDTH = 9
export const LETTER_WIDTH_WITH_GAP = LETTER_WIDTH + 1
const LETTER_HEIGHT = 15
const LETTER_HEIGHT_WITH_GAP = LETTER_HEIGHT + 1
const LETTER_HEIGHT_WITH_LINE = LETTER_HEIGHT_WITH_GAP + 2

function xorshift(number: number) {
  let newNum = number
  newNum ^= newNum << 13
  newNum ^= newNum >> 17
  return newNum
}

function drawLetterOntoGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  letter: CHAR,
  x: number,
  y: number,
  rendering: Rendering | false = false
) {
  const invert = rendering && rendering.invert === true && !rendering.stroke

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

    drawPixelOnGrid(data, width, realX, realY, rendering)
  }

  if (invert) {
    renderStroke(
      data,
      width,
      {
        top: height - y - LETTER_HEIGHT - 1,
        left: x - 1,
        width: LETTER_WIDTH + 1,
        height: LETTER_HEIGHT + 1,
      },
      rendering
    )
  }
}

function drawPixelOnGrid(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  rendering: Rendering | false
) {
  const pixelIndex = (y * width + x) * 4

  if (rendering && rendering.type !== "normal") {
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
    } else if (rendering.type === "color-pick") {
      const randomishFloat = (xorshift(x * 419 + y) % 255) / 255
      const index = Math.floor(randomishFloat * rendering.colors.length)
      const color = rendering.colors[index]
      data[pixelIndex] = color[0]
      data[pixelIndex + 1] = color[1]
      data[pixelIndex + 2] = color[2]
    }
  } else {
    data[pixelIndex] = COLOR[0]
    data[pixelIndex + 1] = COLOR[1]
    data[pixelIndex + 2] = COLOR[2]
  }
}

export interface BoundingBox {
  top: number
  left: number
  width: number
  height: number
}

export interface ClickBox {
  boundingBox: BoundingBox
  onClick?: () => void
}

interface RenderingBase {
  invert?: boolean
  stroke?: boolean
}

interface Normal extends RenderingBase {
  type: "normal"
}

interface Rainbow extends RenderingBase {
  type: "uv"
  boundingBox: BoundingBox
}

interface Color extends RenderingBase {
  type: "color"
  color: [number, number, number]
}

interface RandomRGB extends RenderingBase {
  type: "color-pick"
  colors: [number, number, number][]
}

type Rendering = Rainbow | Color | RandomRGB | Normal

interface LetterProperties {
  xOrigin: number
  yOrigin: number
  rowsHeight: number
  rowsWidth: number
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
  rendering: RenderMode,
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
  } else if (rendering === "fire") {
    return {
      type: "color-pick",
      colors: [
        // [255, 0, 0],
        [255, 40, 0],
        [255, 80, 0],
        [255, 140, 0],
        [220, 220, 0],
        // [255, 220, 0],
      ],
    }
  } else {
    return { type: "normal" }
  }
}

function renderStroke(
  data: Uint8ClampedArray,
  canvasWidth: number,
  boundingBox: BoundingBox,
  rendering: Rendering | false
) {
  const { left, top, width, height } = boundingBox

  for (let x = left; x < left + width + 1; x += 1) {
    drawPixelOnGrid(data, canvasWidth, x, top, rendering)
    drawPixelOnGrid(data, canvasWidth, x, top + height, rendering)
  }
  for (let y = top; y < top + height; y += 1) {
    drawPixelOnGrid(data, canvasWidth, left, y, rendering)
    drawPixelOnGrid(data, canvasWidth, left + width, y, rendering)
  }
}

export interface TextBlock {
  content: string
  active?: boolean
  hoverable?: boolean
  hoverContent?: string
  onClick?: () => void
}

export type TextRow = TextBlock[]

export const renderRows = (
  rows: TextBlock[][],
  updateTexture: (updater: Updater) => void,
  renderConfig: RenderOptions
) => {
  updateTexture((data, width, height, hitIndex) => {
    const rowsHeight = rows.length * LETTER_HEIGHT_WITH_LINE - 2
    const rowsWidth =
      Math.max(
        ...rows.map((row) =>
          row.map((block) => block.content.length).reduce((a, b) => a + b)
        )
      ) * LETTER_WIDTH_WITH_GAP
    const xOrigin = Math.floor((width - rowsWidth) / 2)
    const yOrigin = Math.floor((height - rowsHeight) / 2)

    let index = 0
    let hitZones: ClickBox[] = []

    let postponedPasses: Array<() => void> = []

    rows.forEach((blocks, y) => {
      let offsetSoFar = 0
      blocks.forEach((block) => {
        const content =
          index === hitIndex
            ? block.hoverContent ?? block.content
            : block.content

        const hovering = hitIndex === index
        content.split("").forEach((char, origX) => {
          const x = offsetSoFar + origX

          const rendering = determineRendering(renderConfig.rendering.get(), {
            xOrigin,
            yOrigin,
            rowsHeight,
            rowsWidth,
            y,
          })

          drawLetterOntoGrid(
            data,
            width,
            height,
            char as CHAR,
            xOrigin + LETTER_WIDTH_WITH_GAP * x,
            yOrigin + LETTER_HEIGHT_WITH_LINE * y,
            rendering
              ? {
                  ...rendering,
                  invert:
                    (block.active && (!block.hoverable || !hovering)) ||
                    (!block.active && block.hoverable && hovering),
                }
              : false
          )
        })

        const boundingBox = {
          top: yOrigin + LETTER_HEIGHT_WITH_LINE * y - 1,
          left: xOrigin + offsetSoFar * LETTER_WIDTH_WITH_GAP - 1,
          width: LETTER_WIDTH_WITH_GAP * block.content.length + 1,
          height: LETTER_HEIGHT_WITH_GAP + 1,
        }

        hitZones.push({
          boundingBox,
          onClick: block.onClick,
        })

        if (block.active && block.hoverable && hovering) {
          const renderingBoundingBox: BoundingBox = {
            ...boundingBox,
            top: height - boundingBox.top - boundingBox.height,
            height: boundingBox.height - 1,
            width: boundingBox.width - 1,
          }

          const largerBoundingBox: BoundingBox = {
            top: renderingBoundingBox.top - 1,
            left: renderingBoundingBox.left - 1,
            width: renderingBoundingBox.width + 2,
            height: renderingBoundingBox.height + 2,
          }

          const outerStrokeRendering = determineRendering(
            renderConfig.rendering.get(),
            {
              xOrigin,
              yOrigin,
              rowsHeight,
              rowsWidth,
              y,
            }
          )

          postponedPasses.push(() => {
            renderStroke(data, width, renderingBoundingBox, {
              type: "color",
              color: [0, 0, 0],
            })
            renderStroke(data, width, largerBoundingBox, outerStrokeRendering)
          })
        }
        offsetSoFar += content.length
        index += 1
      })
    })

    postponedPasses.forEach((pass) => pass())

    return hitZones
  })
}

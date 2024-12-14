import "./shader.css"
import { FONT } from "../font/font"
import { base64ToBinary } from "../font/helpers"
import { setupRenderer } from "./shader"

const { updateTexture, getCanvas, render, toggleShowPixels, adjustBlur } =
  setupRenderer()

document.getElementById("shader-container")!.append(getCanvas())

const COLOR = [252, 140, 42]

const LETTER_WIDTH = 9
const LETTER_WIDTH_WITH_GAP = LETTER_WIDTH + 1
const LETTER_HEIGHT = 15
const LETTER_HEIGHT_WITH_GAP = LETTER_HEIGHT + 1
function drawLetterOntoGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  letter: keyof typeof FONT,
  x: number,
  y: number,
  invert: boolean = false
) {
  const binary = base64ToBinary(FONT[letter], LETTER_WIDTH, LETTER_HEIGHT)

  for (let bitIndex = 0; bitIndex < binary.length; bitIndex += 1) {
    const bit = invert ? 1 - binary[bitIndex] : binary[bitIndex]

    const localX = bitIndex % LETTER_WIDTH
    const localY = Math.floor(bitIndex / LETTER_WIDTH)

    const realX = x + localX
    const realY = height - (y + localY) - 1

    for (let i = 0; i < 3; i += 1) {
      const pixelIndex = (realY * width + realX) * 4
      data[pixelIndex + i] = bit * COLOR[i]
    }
  }
}

const generate = () => {
  updateTexture((data, width, height) => {
    data[0] = 255
    const message = "AAAAAAAAAAAAAAAAAAAAAA"

    for (let i = 0; i < message.length; i += 1) {
      drawLetterOntoGrid(
        data,
        width,
        height,
        message.slice(i, i + 1),
        5 + LETTER_WIDTH_WITH_GAP * i,
        20,
        false
      )
    }
  })
  render()
}

document.body.addEventListener("keydown", (e) => {
  if (e.key === "r") generate()
  else if (e.key === "p") toggleShowPixels()
  else if (e.key === "=") adjustBlur(1)
  else if (e.key === "-") adjustBlur(-1)
})

generate()

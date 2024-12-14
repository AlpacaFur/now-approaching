import "./canvas.css"
import { CHARS } from "../../font/font"
import { base64ToImageData, imageDataToBitmapBase64 } from "../../font/helpers"

const canvas = document.createElement("canvas")
canvas.width = 190
canvas.height = 128

const context = canvas.getContext("2d")!

context.fillStyle = "white"
const image = new Image()
image.src = "/fixed-width15x9.png"

image.onload = () => {
  context.drawImage(image, 0, 0)

  const entries = CHARS.map((char, index) => {
    const x = (index % 19) * 10
    const y = Math.floor(index / 19) * 16

    const imageData = context.getImageData(x, y, 9, 15)
    const b64Data = imageDataToBitmapBase64(imageData)

    return [char, b64Data]
  })

  console.log(Object.fromEntries(entries))

  console.timeEnd()

  const elems = CHARS.slice(0, 5).map((char, index) => {
    const x = (index % 19) * 10
    const y = Math.floor(index / 19) * 16

    const newCanvas = document.createElement("canvas")
    newCanvas.width = 9
    newCanvas.height = 15
    const newContext = newCanvas.getContext("2d")!

    const imageData = context.getImageData(x, y, 9, 15)
    console.log(imageDataToBitmapBase64(imageData))

    const newImageData = base64ToImageData(
      imageDataToBitmapBase64(imageData),
      9,
      15
    )
    newContext.putImageData(newImageData, 0, 0)

    const charPairing = document.createElement("div")
    charPairing.classList.add("pairing")
    const label = document.createElement("p")
    label.textContent = char
    charPairing.append(newCanvas)
    charPairing.append(label)

    return charPairing
  })
  document.body.append(...elems)
}

// console.log(
//   bitsToBytes(
//     [
//       [1, 0, 0, 0, 0, 0, 0, 1],
//       [1, 0, 0, 0, 0, 0, 0, 1],
//     ].flat() as Bit[]
//   )
// )
// console.log(
//   bitsToBytes([byteToBits(10), byteToBits(20), byteToBits(50)].flat() as Bit[])
// )
// console.log(byteToBits(10))

document.body.appendChild(document.createElement("p")).textContent =
  CHARS.join(",")

document.body.append(canvas)

// const font = reanimateFont()

// context.putImageData(font["A"], 0, 0)
// context.putImageData(font["B"], 10, 0)
// context.putImageData(font["C"], 20, 0)
// ;("171 × 120")

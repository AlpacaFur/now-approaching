import { CHARS, FONT } from "./font"

export function imageDataToBinary(imageData: ImageData) {
  const output: Bit[] = []
  for (let i = 0; i < imageData.data.length / 4; i += 1) {
    if (imageData.data[i * 4] === 0) {
      output.push(0)
    } else {
      output.push(1)
    }
  }
  return output
}

type Bit = 0 | 1

export function bitsToBytes(bits: Bit[]) {
  const output: number[] = []
  for (let i = 0; i < bits.length / 8; i += 1) {
    let number = 0
    for (let depth = 7; depth >= 0; depth -= 1) {
      number += bits[i * 8 + (7 - depth)] << depth
    }
    output.push(number)
  }
  return output
}

export function byteToBits(byte: number) {
  const output: number[] = []
  for (let depth = 7; depth >= 0; depth -= 1) {
    output.push((byte >> depth) & 1)
  }
  return output as Bit[]
}

export function imageDataToBitmapBase64(imageData: ImageData) {
  const binary = imageDataToBinary(imageData)
  const decimal = bitsToBytes(binary)
  const chars = decimal.map((char) => String.fromCharCode(char)).join("")
  return btoa(chars)
}

export function binaryToByteArray(bits: Bit[]) {
  const white = [255, 255, 255, 255]
  const black = [0, 0, 0, 0]
  return bits.map((bit) => (bit === 0 ? black : white)).flat()
}

export function base64ToImageData(
  base64: string,
  width: number,
  height: number
) {
  const chars = atob(base64)
  const decimal = chars.split("").map((char) => char.charCodeAt(0))
  const binary = decimal
    .map(byteToBits)
    .flat()
    .slice(0, width * height)
  const byteArray = binaryToByteArray(binary)
  return new ImageData(new Uint8ClampedArray(byteArray), width, height)
  // return new ImageData()
}

export function base64ToBinary(base64: string, width: number, height: number) {
  const chars = atob(base64)
  const decimal = chars.split("").map((char) => char.charCodeAt(0))
  const binary = decimal
    .map(byteToBits)
    .flat()
    .slice(0, width * height)

  return binary
}

export function reanimateFont(): Record<string, ImageData> {
  return Object.fromEntries(
    CHARS.map((char) => {
      return [char, base64ToImageData(FONT[char], 9, 15)]
    })
  )
}

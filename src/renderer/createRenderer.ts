import {
  setupProgram,
  bindTriangleBuffer,
  configureTriangleReading,
  initializeTexture,
  drawTriangles,
  setAdjustableUniforms,
} from "./shader-setup"

export interface Uniforms {
  pitch: number
  wipePosition: number
}

export function calculateTextureSize(
  renderWidth: number,
  renderHeight: number,
  pitch: number
) {
  const textureWidth = Math.floor(renderWidth / pitch)
  const textureHeight = Math.floor(renderHeight / pitch)
  return [textureWidth, textureHeight]
}

type NewUpdater = (
  data: ImageData["data"],
  width: number,
  height: number
) => void

export function createRenderer(
  gl: WebGL2RenderingContext,
  initialWidth: number,
  initialHeight: number,
  uniforms: Uniforms
) {
  let image = new ImageData(1, 1)
  let dimensions = { width: initialWidth, height: initialHeight }

  const {
    positionAttributeLocation,
    resolutionLocation,
    textureResolutionLocation,
    adjustableUniforms,
  } = setupProgram(gl)

  bindTriangleBuffer(gl)
  configureTriangleReading(gl, positionAttributeLocation)
  initializeTexture(gl)

  const render = () => {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    drawTriangles(gl)
  }

  const updateUniforms = (updater: (currentUniforms: Uniforms) => void) => {
    updater(uniforms)
    setAdjustableUniforms(gl, uniforms, adjustableUniforms)
  }

  const resize = (newWidth: number, newHeight: number, renderRes: number) => {
    const scaledWidth = Math.floor(
      Math.ceil((newWidth * renderRes) / uniforms.pitch) * uniforms.pitch
    )
    const scaledHeight = Math.floor(
      Math.ceil((newHeight * renderRes) / uniforms.pitch) * uniforms.pitch
    )
    const roundedWidth = Math.ceil(scaledWidth / renderRes)
    const roundedHeight = Math.ceil(scaledHeight / renderRes)

    gl.uniform2f(resolutionLocation, scaledWidth, scaledHeight)
    gl.viewport(0, 0, scaledWidth, scaledHeight)
    const [newTextureWidth, newTextureHeight] = calculateTextureSize(
      roundedWidth,
      roundedHeight,
      uniforms.pitch / renderRes
    )
    dimensions.width = roundedWidth
    dimensions.height = roundedHeight
    image = new ImageData(newTextureWidth, newTextureHeight)
    gl.uniform2f(textureResolutionLocation, image.width, image.height)
    setAdjustableUniforms(gl, uniforms, adjustableUniforms)

    return {
      width: roundedWidth,
      height: roundedHeight,
      scaledWidth,
      scaledHeight,
    }
  }

  const clearImage = () => {
    for (let i = 0; i < image.data.length; i += 1) {
      image.data[i] = 0
    }
  }

  const updateData = (updater: NewUpdater) => {
    clearImage()
    updater(image.data, image.width, image.height)
    render()
  }

  const getWidthHeight = (): [number, number] => {
    return [dimensions.width, dimensions.height]
  }

  resize(initialWidth, initialHeight, 1)
  render()

  return {
    render,
    resize,
    updateData,
    getWidthHeight,
    updateUniforms,
    uniforms,
  }
}

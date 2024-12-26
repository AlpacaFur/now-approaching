import type { Uniforms } from "./createRenderer"
import { FRAGMENT_SHADER_SOURCE } from "../shaders/fragment"
import { VERTEX_SHADER_SOURCE } from "../shaders/vertex"

export const RECT_TRIANGLES = [
  -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0,
]

export const TRIANGLE_POINT_COUNT = RECT_TRIANGLES.length / 2

export function createShader(
  gl: WebGLRenderingContext,
  type:
    | WebGLRenderingContext["VERTEX_SHADER"]
    | WebGLRenderingContext["FRAGMENT_SHADER"],
  source: string
) {
  var shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (success) {
    return shader
  }

  gl.deleteShader(shader)
  throw new Error("failed to create shader")
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  var program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  var success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (success) {
    return program
  }

  gl.deleteProgram(program)
  throw new Error("failed to create program")
}

export function getGLContext() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement
  const gl = canvas.getContext("webgl2")!
  if (!gl) {
    throw new Error("couldn't get webgl2 context")
  }
  return gl
}

export function assembleProgram(gl: WebGL2RenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER_SOURCE
  )

  return createProgram(gl, vertexShader, fragmentShader)
}

export function bindTriangleBuffer(gl: WebGL2RenderingContext) {
  const trianglePositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, trianglePositionBuffer)
  const trianglePositions = RECT_TRIANGLES
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(trianglePositions),
    gl.STATIC_DRAW
  )
}

export function configureTriangleReading(
  gl: WebGL2RenderingContext,
  positionAttributeLocation: number
) {
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  const size = 2 // 2 components per iteration
  const type = gl.FLOAT // the data is 32bit floats
  const normalize = false // don't normalize the data
  const stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0 // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  )
}
export function initializeTexture(gl: WebGL2RenderingContext) {
  // Create a texture.
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
}

export function setAdjustableUniforms(
  gl: WebGL2RenderingContext,
  uniforms: Uniforms,
  locations: ReturnType<typeof setupProgram>["adjustableUniforms"]
) {
  const {
    pitchLocation,
    radiusLocation,
    blurDistanceLocation,
    secondBlurDistanceLocation,
    brightenLocation,
    wipePositionLocation,
  } = locations

  gl.uniform1f(pitchLocation, uniforms.pitch)
  gl.uniform1f(radiusLocation, uniforms.pitch * 0.4)
  gl.uniform1f(blurDistanceLocation, uniforms.pitch * 1.0)
  gl.uniform1f(secondBlurDistanceLocation, uniforms.pitch * 2.4)
  gl.uniform1f(brightenLocation, 1.5)
  gl.uniform1f(wipePositionLocation, uniforms.wipePosition)
}

export function setupProgram(gl: WebGL2RenderingContext) {
  const program = assembleProgram(gl)

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
  gl.enableVertexAttribArray(positionAttributeLocation)

  const resolutionLocation = gl.getUniformLocation(
    program,
    "u_output_resolution"
  )
  const textureResolutionLocation = gl.getUniformLocation(
    program,
    "u_tex_resolution"
  )
  const pitchLocation = gl.getUniformLocation(program, "PITCH")
  const radiusLocation = gl.getUniformLocation(program, "RADIUS")
  const brightenLocation = gl.getUniformLocation(program, "BRIGHTEN")
  const blurDistanceLocation = gl.getUniformLocation(program, "BLUR_DISTANCE")
  const secondBlurDistanceLocation = gl.getUniformLocation(
    program,
    "SECOND_BLUR_DISTANCE"
  )
  const wipePositionLocation = gl.getUniformLocation(program, "WIPE_POSITION")

  const adjustableUniforms = {
    pitchLocation,
    radiusLocation,
    brightenLocation,
    blurDistanceLocation,
    secondBlurDistanceLocation,
    wipePositionLocation,
  }

  gl.useProgram(program)

  return {
    resolutionLocation,
    textureResolutionLocation,
    positionAttributeLocation,
    adjustableUniforms,
  }
}

export function drawTriangles(gl: WebGL2RenderingContext) {
  gl.drawArrays(gl.TRIANGLES, 0, TRIANGLE_POINT_COUNT)
}

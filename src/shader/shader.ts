import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  PlaneGeometry,
  Vector2,
  Mesh,
  DataTexture,
  RGBAFormat,
  NearestFilter,
  ShaderMaterial,
  Texture,
} from "three"
import { FRAGMENT_SHADER } from "./fragment"
import { VERTEX_SHADER } from "./vertex"
import { animationStep } from "../animation"

const RENDER_RES = Math.max(2.0, devicePixelRatio)

const PITCH = 5.00001 * RENDER_RES
const RADIUS = PITCH * 0.4
const BLUR_DISTANCE = PITCH * 1.0
const SECOND_BLUR_DISTANCE = PITCH * 2.4
const BRIGHTEN = 1.5

export type Updater = (
  data: Uint8ClampedArray,
  width: number,
  height: number
) => void

function roundedRendererDims(pitch: number): [number, number] {
  return [
    Math.floor(Math.ceil(window.innerWidth / pitch) * pitch),
    Math.floor(Math.ceil(window.innerHeight / pitch) * pitch),
  ]
}

export function setupRenderer() {
  const renderer = new WebGLRenderer()
  renderer.setPixelRatio(RENDER_RES)
  renderer.setSize(...roundedRendererDims(PITCH))

  let lastUpdater: Updater = () => undefined

  let wipeDirection = -1

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  var geometry = new PlaneGeometry(2, 2)

  let { data, texture } = createDataTexturePair(
    Math.ceil(window.innerWidth / PITCH),
    Math.ceil(window.innerHeight / PITCH)
  )

  const uniforms: NonNullable<
    NonNullable<ConstructorParameters<typeof ShaderMaterial>[0]>["uniforms"]
  > = {
    u_output_resolution: {
      value: new Vector2(...roundedRendererDims(PITCH)).multiplyScalar(
        RENDER_RES
      ),
    },
    u_texture_resolution: {
      value: new Vector2(
        texture.image.width,
        texture.image.height
      ).multiplyScalar(RENDER_RES),
    },
    u_texture: {
      value: texture,
    },
    PITCH: {
      value: PITCH,
    },
    RADIUS: {
      value: RADIUS,
    },
    BRIGHTEN: {
      value: BRIGHTEN,
    },
    BLUR_DISTANCE: {
      value: BLUR_DISTANCE,
    },
    SECOND_BLUR_DISTANCE: {
      value: SECOND_BLUR_DISTANCE,
    },
    WIPE_POSITION: {
      value: 0.0,
    },
  }

  console.log(
    uniforms.u_output_resolution.value,
    texture.image.width,
    texture.image.height
  )

  var material = new ShaderMaterial({
    uniforms: uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  })

  var mesh = new Mesh(geometry, material)
  scene.add(mesh)

  // Add the event listeners
  window.addEventListener("resize", onWindowResize, false)

  /*
   * Renders the sketch
   */
  function render() {
    renderer.render(scene, camera)
  }

  /*
   * Updates the renderer size and the uniforms when the window is resized
   */
  function onWindowResize() {
    renderer.setSize(...roundedRendererDims(uniforms.PITCH.value))

    const { data: newData, texture: newTexture } = createDataTexturePair(
      Math.ceil(window.innerWidth / uniforms.PITCH.value),
      Math.ceil(window.innerHeight / uniforms.PITCH.value)
    )
    let oldTexture = texture
    data = newData
    texture = newTexture
    uniforms.u_texture.value = texture
    uniforms.u_texture_resolution.value.set(
      texture.image.width,
      texture.image.height
    )

    uniforms.u_output_resolution.value
      .set(...roundedRendererDims(uniforms.PITCH.value))
      .multiplyScalar(RENDER_RES)
    updateTexture(lastUpdater)
    oldTexture.dispose()
  }

  function createDataTexturePair(width: number, height: number) {
    width *= RENDER_RES
    height *= RENDER_RES
    const data = new Uint8ClampedArray(width * height * 4)
    const texture = createTexture(data, width, height)
    return { data, texture }
  }

  function createTexture(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Texture {
    const texture = new DataTexture(data, width, height, RGBAFormat)
    texture.minFilter = NearestFilter
    texture.magFilter = NearestFilter
    texture.needsUpdate = true
    return texture
  }

  function clearTexture() {
    for (let i = 0; i < data.length; i += 1) {
      data[i] = 0
    }
  }

  function updateTexture(updater: Updater) {
    clearTexture()
    updater(data, texture.image.width, texture.image.height)
    texture.needsUpdate = true
    lastUpdater = updater
    render()
  }

  function getCanvas() {
    return renderer.domElement
  }

  function toggleShowPixels() {
    wipeDirection *= -1
    animateWipe()
  }

  function rerender() {
    updateTexture(lastUpdater)
  }

  function animateWipe() {
    requestAnimationFrame(
      animationStep(
        uniforms.WIPE_POSITION.value,
        wipeDirection === 1 ? 1 : 0,
        500,
        null,
        (value) => {
          uniforms.WIPE_POSITION.value = value
          render()
        }
      )
    )
  }

  function adjustBlur(dir: 1 | -1) {
    uniforms.SECOND_BLUR_DISTANCE.value += dir * 1.0
    console.log(uniforms.SECOND_BLUR_DISTANCE.value)
    render()
  }

  function adjustWipe(dir: 1 | -1) {
    uniforms.WIPE_POSITION.value += dir * 0.05
    render()
  }

  function adjustPitch(dir: 1 | -1) {
    let pitch = Math.floor(uniforms.PITCH.value + dir * 1)
    pitch += 0.00001
    pitch *= RENDER_RES
    uniforms.PITCH.value = pitch
    uniforms.RADIUS.value = pitch * 0.4
    uniforms.BLUR_DISTANCE.value = pitch * 1.0
    uniforms.SECOND_BLUR_DISTANCE.value = pitch * 2.4
    onWindowResize()
  }

  function updatePitch(pitch: number) {
    if (uniforms.PITCH.value === pitch) return
    pitch += 0.00001
    pitch *= RENDER_RES
    uniforms.PITCH.value = pitch
    uniforms.RADIUS.value = pitch * 0.4
    uniforms.BLUR_DISTANCE.value = pitch * 1.0
    uniforms.SECOND_BLUR_DISTANCE.value = pitch * 2.4
    onWindowResize()
  }

  return {
    render,
    rerender,
    updateTexture,
    getCanvas,
    toggleShowPixels,
    adjustBlur,
    adjustWipe,
    updatePitch,
  }
}

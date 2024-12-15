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
import { ClickBox } from "./texture-drawing"

const RENDER_RES = Math.max(2.0, devicePixelRatio)

const PITCH = 5.00001 * RENDER_RES
const RADIUS = PITCH * 0.4
const BLUR_DISTANCE = PITCH * 1.0
const SECOND_BLUR_DISTANCE = PITCH * 2.4
const BRIGHTEN = 1.5

export type Updater = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  hitIndex: number | false
) => ClickBox[] | undefined

export function localStorageSync<T extends {}>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const urlParams = new URL(window.location.toString()).searchParams

  const currentValue = urlParams.has(key)
    ? urlParams.get(key)
    : localStorage.getItem(key)

  const setLocalStorage = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  if (currentValue !== null) {
    return [JSON.parse(currentValue), setLocalStorage]
  } else {
    setLocalStorage(defaultValue)
    return [defaultValue, setLocalStorage]
  }
}

export function setupRenderer() {
  let hitZones: ClickBox[] = []
  let activeHitZone: number | false = false

  let lastUpdater: Updater = () => undefined

  const [STARTING_WIPE_POSITION, setStartingWipePosition] = localStorageSync(
    "starting-wipe-position",
    0.0
  )

  let wipeDirection = STARTING_WIPE_POSITION === 0.0 ? -1 : 1

  const renderer = new WebGLRenderer()
  renderer.setPixelRatio(RENDER_RES)
  renderer.setSize(...roundedRendererDims(PITCH))

  window.addEventListener("blur", () => {
    handleMouseCollision(-1, -1)
  })

  renderer.domElement.addEventListener("click", (e) => {
    const collision = getMouseCollision(e.pageX, e.pageY)
    if (collision !== false) {
      hitZones[collision]?.onClick?.()
    }
    console.log("clicked", getMouseCollision(e.pageX, e.pageY))
  })

  renderer.domElement.addEventListener("mousemove", (e) => {
    handleMouseCollision(e.pageX, e.pageY)
  })

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  var geometry = new PlaneGeometry(2, 2)

  const [screenWidth, screenHeight] = getWidthHeight()

  let { data, texture } = createDataTexturePair(
    Math.ceil(screenWidth / PITCH),
    Math.ceil(screenHeight / PITCH)
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
      value: STARTING_WIPE_POSITION,
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

  function getWidthHeight(): [number, number] {
    const parent = renderer.domElement.parentElement
    if (parent !== null) {
      const boundingBox = parent.getBoundingClientRect()
      return [boundingBox.width, boundingBox.height]
    } else {
      return [window.innerWidth, window.innerHeight]
    }
  }

  function roundedRendererDims(pitch: number): [number, number] {
    const [screenWidth, screenHeight] = getWidthHeight()
    return [
      Math.floor(Math.ceil(screenWidth / pitch) * pitch),
      Math.floor(Math.ceil(screenHeight / pitch) * pitch),
    ]
  }

  /*
   * Updates the renderer size and the uniforms when the window is resized
   */
  function onWindowResize() {
    renderer.setSize(...roundedRendererDims(uniforms.PITCH.value))

    const [screenWidth, screenHeight] = getWidthHeight()

    const { data: newData, texture: newTexture } = createDataTexturePair(
      Math.ceil(screenWidth / uniforms.PITCH.value),
      Math.ceil(screenHeight / uniforms.PITCH.value)
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
    hitZones =
      updater(data, texture.image.width, texture.image.height, activeHitZone) ??
      []
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
    const targetPosition = wipeDirection === 1 ? 1 : 0
    setStartingWipePosition(targetPosition)
    requestAnimationFrame(
      animationStep(
        uniforms.WIPE_POSITION.value,
        targetPosition,
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

  function getMouseCollision(origX: number, origY: number): number | false {
    const pitch = uniforms.PITCH.value

    const x = origX / (pitch / RENDER_RES)
    const y = origY / (pitch / RENDER_RES)

    const firstHit = hitZones.findIndex(
      ({ boundingBox: zone }) =>
        x >= zone.left &&
        x < zone.left + zone.width &&
        y >= zone.top &&
        y < zone.top + zone.height
    )

    if (firstHit === -1) {
      return false
    } else {
      return firstHit
    }
  }

  function handleMouseCollision(x: number, y: number) {
    const hit = getMouseCollision(x, y)

    if (hit === activeHitZone) {
      return
    } else {
      if (hit !== false && hitZones[hit].onClick !== undefined) {
        renderer.domElement.classList.add("pointer")
      } else {
        renderer.domElement.classList.remove("pointer")
      }
      activeHitZone = hit
      rerender()
    }
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
    getWidthHeight,
  }
}

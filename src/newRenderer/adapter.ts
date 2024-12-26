import type { ClickBox } from "../rendering/texture-drawing"
import { getGLContext } from "./shader-setup"
import { createRenderer } from "./createRenderer"
import { animationStep } from "../animation"
import type { RenderOptions } from "../main"

export const RENDER_RES = Math.max(2.0, Math.round(devicePixelRatio))

export type Updater = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  hitIndex: number | false
) => ClickBox[] | undefined

export function newSetupRenderer(options: RenderOptions) {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement
  const container = document.getElementById("shader-container")!

  let hitZones: ClickBox[] = []
  let activeHitZone: number | false = false
  let lastUpdater: Updater | undefined

  const gl = getGLContext()
  const rect = container.getBoundingClientRect()
  const {
    resize,
    updateData,
    render,
    getWidthHeight,
    updateUniforms,
    uniforms,
  } = createRenderer(gl, rect.width, rect.height, {
    pitch: 10.0 * RENDER_RES,
    wipePosition: options.showPixels.get() ? 1 : 0,
  })

  window.addEventListener("blur", () => {
    handleMouseCollision(-1, -1)
  })

  canvas.addEventListener("click", (e) => {
    const collision = getMouseCollision(e.pageX, e.pageY)
    if (collision !== false) {
      hitZones[collision]?.onClick?.()
    }
  })

  canvas.addEventListener("mousemove", (e) => {
    handleMouseCollision(e.pageX, e.pageY)
  })

  function getMouseCollision(origX: number, origY: number): number | false {
    const pitch = uniforms.pitch

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
        canvas.classList.add("pointer")
      } else {
        canvas.classList.remove("pointer")
      }
      activeHitZone = hit
      rerender()
    }
  }

  const updateTexture = (updater: Updater) => {
    lastUpdater = updater
    updateData((data, width, height) => {
      hitZones = updater(data, width, height, activeHitZone) ?? []
    })
  }

  const rerender = () => {
    if (lastUpdater) {
      updateTexture(lastUpdater)
    }
    render()
  }

  const updateSize = () => {
    const containerBoundingBox = container.getBoundingClientRect()

    const { width, height, scaledWidth, scaledHeight } = resize(
      containerBoundingBox.width,
      containerBoundingBox.height,
      RENDER_RES
    )

    canvas.width = scaledWidth
    canvas.height = scaledHeight
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }

  options.showPixels.subscribe((newValue) => {
    updateUniforms((uniforms) => {
      requestAnimationFrame(
        animationStep(
          uniforms.wipePosition,
          newValue ? 1 : 0,
          500,
          null,
          (value) => {
            updateUniforms((uniforms) => (uniforms.wipePosition = value))
            render()
          }
        )
      )
    })
  })

  window.addEventListener("resize", updateSize, false)
  updateSize()

  return {
    render,
    rerender,
    updateTexture,
    getCanvas: () => document.getElementById("canvas") as HTMLCanvasElement,
    adjustBlur: () => undefined,
    adjustWipe: () => undefined,
    updatePitch: (newPitch: number) => {
      updateUniforms((uniforms) => {
        uniforms.pitch = newPitch * RENDER_RES
      })
      updateSize()
    },
    getWidthHeight: getWidthHeight,
  }
}

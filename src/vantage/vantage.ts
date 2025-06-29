import { DATA } from "../countdown/data"
import "./vantage.css"

let streamEndTimer: ReturnType<typeof setTimeout>

let cameraOpen = true
let cameraDirection = "environment"

const videoElem = document.getElementById("camera") as HTMLVideoElement
const snapEffectElem = document.getElementById("snap-effect") as HTMLDivElement
const videoContainerElem = document.getElementById(
  "video-container"
) as HTMLDivElement
const takePhotoElem = document.getElementById(
  "start-camera"
) as HTMLIFrameElement
const openCameraElem = document.getElementById(
  "open-camera"
) as HTMLButtonElement

document.getElementById("back")!.addEventListener("click", () => {
  history.back()
})

document.getElementById("flip-horizontal")!.addEventListener("click", () => {
  videoElem.classList.toggle("flip-horizontal")
})

document.getElementById("flip-camera")!.addEventListener("click", () => {
  if (videoElem.srcObject) {
    cameraDirection = cameraDirection === "environment" ? "self" : "environment"
    ;(videoElem.srcObject as MediaStream).getTracks()[0].applyConstraints({
      facingMode: cameraDirection,
    })
  }
})

document.getElementById("minimize-camera")!.addEventListener("click", () => {
  videoContainerElem.classList.add("minimize")
  openCameraElem.classList.remove("hide-side")
  streamEndTimer = setTimeout(() => {
    if (videoElem.srcObject) {
      ;(videoElem.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop())
    }
    videoElem.srcObject = null
  }, 500)
  cameraOpen = false
})

openCameraElem.addEventListener("click", () => {
  if (!cameraOpen) {
    cameraOpen = true
    clearTimeout(streamEndTimer)
    videoContainerElem.classList.remove("minimize")
    startStream()
    openCameraElem.classList.add("hide-side")
  }
})

takePhotoElem.addEventListener("click", (e) => {
  videoElem.pause()
  snapEffectElem.animate([{}, { border: "60px solid white" }, {}], {
    duration: 400,
    easing: "ease-out",
  })
  videoContainerElem.classList.remove("live")
  e.stopPropagation()
})

videoContainerElem.addEventListener("click", () => {
  if (videoElem.paused) {
    videoElem.play()
    videoContainerElem.classList.add("live")
  }
})

videoContainerElem.addEventListener("click", () => {
  if (videoElem.paused) {
    videoElem.play()
    videoContainerElem.classList.add("live")
  }
})

async function startStream(direction: "user" | "environment" = "environment") {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: direction,
      },
    })

    videoElem.srcObject = mediaStream
    videoElem.play()
  } catch {}
}

async function start() {
  const url = new URL(window.location.toString())

  const siteParam = url.searchParams.get("site")

  const targetSite = DATA.find((site) => site.slug === siteParam)

  if (!targetSite) {
    window.location.assign("/")
    return
  }

  const iframeElem = document.getElementById("iframe") as HTMLIFrameElement
  iframeElem.src = targetSite.embeddableUrl ?? targetSite.url

  startStream()
  videoContainerElem.classList.add("live")
}

start()

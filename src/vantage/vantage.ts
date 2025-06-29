import { DATA } from "../countdown/data"
import "./vantage.css"

let streamEndTimer: ReturnType<typeof setTimeout>

let cameraOpen = true
let cameraDirection: "environment" | "user" = "environment"

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

function waitForMs(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

document.getElementById("flip-camera")!.addEventListener("click", async () => {
  cameraDirection = cameraDirection === "environment" ? "user" : "environment"
  videoElem.classList.remove("unblur")
  videoElem.classList.add("flip")
  await Promise.all([startStream(cameraDirection), waitForMs(500)])
  videoElem.classList.remove("flip")
  videoElem.classList.add("unblur")
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
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: direction,
    },
  })

  const oldSrc = videoElem.srcObject
  videoElem.srcObject = mediaStream
  await videoElem.play()
  if (oldSrc) {
    ;(oldSrc as MediaStream).getTracks().forEach((track) => track.stop())
  }
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

  startStream().catch(console.error)
  videoContainerElem.classList.add("live")
}

start()

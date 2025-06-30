import { DATA, Entry, type Author } from "../countdown/data"
import { OptionStore } from "../options"
import "./vantage.css"

let streamEndTimer: ReturnType<typeof setTimeout>

let cameraOpen = new OptionStore("vantage-camera-open", false)
let cameraDirection = new OptionStore<"environment" | "user">(
  "vantage-camera-direction",
  "environment"
)
let cameraCoverMode = new OptionStore("vantage-camera-cover-mode", true)
let flipSelfie = new OptionStore("vantage-flip-selfie", true)

const videoElem = document.getElementById("camera") as HTMLVideoElement
const settingsElem = document.getElementById(
  "settings-menu"
) as HTMLVideoElement
const snapEffectElem = document.getElementById("snap-effect") as HTMLDivElement
const videoContainerElem = document.getElementById(
  "video-container"
) as HTMLDivElement
const iframeContainerElem = document.getElementById(
  "iframe-container"
) as HTMLDivElement
const takePhotoElem = document.getElementById("take-photo") as HTMLButtonElement
const siteIFrameElem = document.getElementById("iframe") as HTMLIFrameElement
const openCameraElem = document.getElementById(
  "open-camera"
) as HTMLButtonElement

;["back", "back-side"].forEach((elemId) =>
  document.getElementById(elemId)!.addEventListener("click", () => {
    history.back()
  })
)
;["refresh", "refresh-side"].forEach((elemId) =>
  document.getElementById(elemId)!.addEventListener("click", () => {
    siteIFrameElem.src = siteIFrameElem.src
    siteIFrameElem.animate([{}, { opacity: 0.75 }, {}], 250)
  })
)

document.getElementById("settings")!.addEventListener("click", () => {
  settingsElem.classList.remove("hidden")
})
document.getElementById("close-settings")!.addEventListener("click", () => {
  settingsElem.classList.add("hidden")
})

const flipHorizontalElem = document.getElementById(
  "flip-horizontal"
) as HTMLInputElement
const coverModeElem = document.getElementById("cover-mode") as HTMLInputElement

function updateSelfieFlip() {
  videoElem.classList.toggle(
    "flip-horizontal",
    flipSelfie.get() && cameraDirection.get() === "user"
  )
}

flipHorizontalElem.checked = flipSelfie.get()
updateSelfieFlip()

flipHorizontalElem.addEventListener("click", () => {
  flipSelfie.set(!flipSelfie.get())
  updateSelfieFlip()
})

coverModeElem.checked = cameraCoverMode.get()
videoElem.classList.toggle("fit", cameraCoverMode.get())
coverModeElem.addEventListener("click", () => {
  cameraCoverMode.set(videoElem.classList.toggle("fit"))
})

function waitForMs(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

document.getElementById("flip-camera")!.addEventListener("click", async () => {
  const wasFlipped = cameraDirection.get() === "user" && flipSelfie.get()
  cameraDirection.set(
    cameraDirection.get() === "environment" ? "user" : "environment"
  )

  const flipClass = wasFlipped ? "flip-reverse" : "flip"

  updateSelfieFlip()
  videoElem.classList.remove("unblur")
  videoElem.classList.add(flipClass)
  await Promise.all([startStream(cameraDirection.get()), waitForMs(500)])
  videoElem.classList.remove(flipClass)
  videoElem.classList.add("unblur")
})

document.getElementById("minimize-camera")!.addEventListener("click", () => {
  videoContainerElem.classList.add("minimize")
  iframeContainerElem.classList.remove("hide-side")
  streamEndTimer = setTimeout(() => {
    if (videoElem.srcObject) {
      ;(videoElem.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop())
    }
    videoElem.srcObject = null
  }, 500)
  cameraOpen.set(false)
})

openCameraElem.addEventListener("click", () => {
  if (!cameraOpen.get()) {
    cameraOpen.set(true)
    clearTimeout(streamEndTimer)
    videoContainerElem.classList.remove("minimize")
    startStream()
    iframeContainerElem.classList.add("hide-side")
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

function authorToLink(author: Author): Node {
  const a = document.createElement("a")
  a.href = author.url
  a.textContent = author.name
  a.target = "__blank"
  return a
}

function generateAuthors(site: Entry): Node[] {
  if (!site.authors) return []
  if (site.authors.length === 1) {
    return [authorToLink(site.authors[0])]
  }

  return [
    ...site.authors
      .slice(0, -2)
      .flatMap((author) => [
        authorToLink(author),
        document.createTextNode(", "),
      ]),
    authorToLink(site.authors.at(-2)!),
    document.createTextNode(" & "),
    authorToLink(site.authors.at(-1)!),
  ]
}

async function start() {
  const url = new URL(window.location.toString())

  const siteParam = url.searchParams.get("site")

  const targetSite = DATA.find((site) => site.slug === siteParam)

  if (!targetSite) {
    window.location.assign("/")
    return
  }

  document.getElementById("site-url")!.textContent =
    targetSite.displayUrl ?? new URL(targetSite.url).host

  document.body.style.setProperty(
    "--background",
    targetSite.color?.accent ?? "#ff0000"
  )
  document.body.style.setProperty(
    "--foreground",
    targetSite.color?.lightText ? "#ffffff" : "#000000"
  )
  document.body.style.setProperty(
    "--alternate",
    targetSite.color?.alternate ?? "#cc0000"
  )

  document
    .getElementById("site-authors")!
    .replaceChildren(...generateAuthors(targetSite))

  siteIFrameElem.src = targetSite.embeddableUrl ?? targetSite.url

  if (cameraOpen.get()) {
    startStream(cameraDirection.get()).catch(console.error)
  } else {
    iframeContainerElem.classList.remove("hide-side")
    videoContainerElem.classList.add("minimize")
  }
  videoContainerElem.classList.add("live")
}

document.body.classList.remove("before-load")
start()

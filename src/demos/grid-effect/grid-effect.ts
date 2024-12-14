import "./grid-effect.css"

const SKEW = 7
const CELL_SIZE = 0.8 * SKEW
const GAP = SKEW - CELL_SIZE

export function randomNested(canvas: HTMLCanvasElement) {
  const rect = canvas.parentElement!.getBoundingClientRect()
  canvas.height = rect.height
  canvas.width = rect.width

  const context = canvas.getContext("2d")!
  context.fillStyle = "#090909"

  for (let x = 0; x < canvas.width / SKEW; x += 1) {
    for (let y = 0; y < canvas.height / SKEW; y += 1) {
      context.fillStyle = Math.random() > 0.5 ? "#090909" : "orange"
      context.beginPath()
      context.roundRect(x * SKEW + GAP, y * SKEW + GAP, CELL_SIZE, CELL_SIZE, 2)
      context.fill()
      context.fillStyle = Math.random() > 0.5 ? "#090909" : "orange"
      context.beginPath()
      context.roundRect(
        x * SKEW + GAP + CELL_SIZE / 4,
        y * SKEW + GAP + CELL_SIZE / 4,
        CELL_SIZE / 2,
        CELL_SIZE / 2,
        2
      )
      context.fill()
    }
  }
}

const canvas1 = document.getElementById("canvas") as HTMLCanvasElement
const canvas2 = document.getElementById("canvas2") as HTMLCanvasElement

// initialize()
randomNested(canvas1)
randomNested(canvas2)

const switchFade = () => {
  if (canvas1.classList.contains("fadeout")) {
    randomNested(canvas1)
  } else {
    randomNested(canvas2)
  }

  canvas1.classList.toggle("fadein")
  canvas1.classList.toggle("fadeout")
  canvas2.classList.toggle("fadeout")
  canvas2.classList.toggle("fadein")
}

setInterval(switchFade, 3000)

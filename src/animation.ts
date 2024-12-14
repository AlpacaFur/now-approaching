function lerp(zeroVal: number, oneVal: number, percent: number) {
  return zeroVal * (1 - percent) + oneVal * percent
}

export function easeInOut(x: number) {
  return lerp(x ** 2, 1 - (1 - x) ** 2, x)
}

function lerpWithEasing(
  zeroVal: number,
  oneVal: number,
  percent: number,
  easingFunction: (percent: number) => number
) {
  return zeroVal * (1 - easingFunction(percent)) + oneVal * percent
}

export function animationStep(
  origVal: number,
  newVal: number,
  totalLength = 1000,
  start: number | null = null,
  callback: (value: number) => void
) {
  return (ts: number) => {
    let deltaTime = ts - (start ?? 0)
    if (start == null) deltaTime = 0
    if (deltaTime >= totalLength) {
      callback(lerpWithEasing(origVal, newVal, 1, easeInOut))
      return
    }
    callback(
      lerpWithEasing(origVal, newVal, deltaTime / totalLength, easeInOut)
    )

    requestAnimationFrame(
      animationStep(origVal, newVal, totalLength, start ?? ts, callback)
    )
  }
}

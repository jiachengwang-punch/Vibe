import { useRef, useCallback } from "react"

interface LongPressOptions {
  onShortPress: () => void
  onLongPress: () => void
  onLongPressProgress?: (progress: number) => void // 0–1 over threshold
  threshold?: number // ms
}

export function useLongPress({
  onShortPress,
  onLongPress,
  onLongPressProgress,
  threshold = 600,
}: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef<number>(0)
  const firedRef = useRef(false)
  const pressedRef = useRef(false) // 区分"鼠标只是路过"和"真正按下"
  const rafRef = useRef<number | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    timerRef.current = null
    rafRef.current = null
  }, [])

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      pressedRef.current = true
      firedRef.current = false
      startRef.current = Date.now()

      if (onLongPressProgress) {
        const tick = () => {
          const elapsed = Date.now() - startRef.current
          onLongPressProgress(Math.min(elapsed / threshold, 1))
          if (elapsed < threshold) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      }

      timerRef.current = setTimeout(() => {
        firedRef.current = true
        onLongPress()
      }, threshold)
    },
    [onLongPress, onLongPressProgress, threshold]
  )

  const end = useCallback(() => {
    // 未曾按下（鼠标只是路过后离开），直接忽略
    if (!pressedRef.current) return
    pressedRef.current = false
    cancel()
    if (!firedRef.current) {
      onShortPress()
    }
    onLongPressProgress?.(0)
  }, [cancel, onShortPress, onLongPressProgress])

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: end,
    onTouchStart: start,
    onTouchEnd: end,
  }
}

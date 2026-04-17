import { useRef, useCallback, useEffect } from "react"
import { useMotionValue, useSpring } from "framer-motion"

export function useCursorKinetics() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // raw normalized values (-0.5 to 0.5)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // spring-smoothed
  const tiltX = useSpring(rawY, { stiffness: 120, damping: 20 })
  const tiltY = useSpring(rawX, { stiffness: 120, damping: 20 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    rawX.set(nx * 28) // max ±14 deg
    rawY.set(ny * -22)
  }, [rawX, rawY])

  const handleMouseLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("mousemove", handleMouseMove)
    el.addEventListener("mouseleave", handleMouseLeave)
    return () => {
      el.removeEventListener("mousemove", handleMouseMove)
      el.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return { containerRef, tiltX, tiltY }
}

import { useCallback } from "react"

export function useHaptic() {
  const pop = useCallback(() => {
    if ("vibrate" in navigator) navigator.vibrate(12)
  }, [])

  // Simulates an inflation pump: progressively tighter pulses
  const pumpStart = useCallback(() => {
    if (!("vibrate" in navigator)) return
    // Pattern: [vibrate, pause, vibrate, pause, ...]
    // Pulses get shorter gaps = faster pumping sensation
    navigator.vibrate([10, 80, 14, 65, 18, 50, 22, 38, 26, 28, 30, 20, 35])
  }, [])

  const pumpStop = useCallback(() => {
    if ("vibrate" in navigator) navigator.vibrate(0)
  }, [])

  return { pop, pumpStart, pumpStop }
}

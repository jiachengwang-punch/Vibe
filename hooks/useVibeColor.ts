import { useState, useEffect } from "react"

export interface VibeColorScheme {
  bg: string
  bgEnd: string
  accent: string
  accentGlow: string
  text: string
  thumbTint: string
}

function computeVibeColor(hour: number): VibeColorScheme {
  if (hour >= 5 && hour < 8) {
    // Dawn: mint + lavender
    return {
      bg: "#C8F7C5",
      bgEnd: "#E8D5F5",
      accent: "#A78BFA",
      accentGlow: "rgba(167,139,250,0.4)",
      text: "#4A3F6B",
      thumbTint: "#B5EAD7",
    }
  } else if (hour >= 8 && hour < 12) {
    // Morning: warm lemon + peach
    return {
      bg: "#FFF4C2",
      bgEnd: "#FECBA1",
      accent: "#FB923C",
      accentGlow: "rgba(251,146,60,0.4)",
      text: "#7C3A10",
      thumbTint: "#FDE68A",
    }
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: dopamine — electric coral + cyan
    return {
      bg: "#FF6B6B",
      bgEnd: "#4ECDC4",
      accent: "#FFE66D",
      accentGlow: "rgba(255,230,109,0.5)",
      text: "#FFFFFF",
      thumbTint: "#FFE66D",
    }
  } else if (hour >= 17 && hour < 21) {
    // Evening: sunset orange + deep rose
    return {
      bg: "#FF8C42",
      bgEnd: "#C62A6B",
      accent: "#FFD93D",
      accentGlow: "rgba(255,217,61,0.45)",
      text: "#FFFFFF",
      thumbTint: "#FFD93D",
    }
  } else {
    // Night: Klein blue + aurora teal
    return {
      bg: "#0D1B8E",
      bgEnd: "#001535",
      accent: "#00E5FF",
      accentGlow: "rgba(0,229,255,0.4)",
      text: "#E0F7FF",
      thumbTint: "#00E5FF",
    }
  }
}

export function useVibeColor() {
  const [colors, setColors] = useState<VibeColorScheme>(() =>
    computeVibeColor(new Date().getHours())
  )

  useEffect(() => {
    const update = () => setColors(computeVibeColor(new Date().getHours()))
    // refresh every minute
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return colors
}

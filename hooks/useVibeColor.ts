import { useState, useEffect } from "react"

export interface VibeColorScheme {
  bg: string
  bgEnd: string
  accent: string
  accentGlow: string
  text: string
  thumbTint: string
}

// ── 色相旋转工具 ──────────────────────────────────────────────
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toH = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0")
  return `#${toH(f(0))}${toH(f(8))}${toH(f(4))}`
}

function rotateHex(hex: string, deg: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h + deg, s, l)
}

function applyDailyShift(scheme: VibeColorScheme, day: number): VibeColorScheme {
  // 每天旋转 ±30° 以内，周期约 47 天循环一圈
  const deg = ((day * 23) % 61) - 30
  if (deg === 0) return scheme
  const bg = rotateHex(scheme.bg, deg)
  const bgEnd = rotateHex(scheme.bgEnd, deg)
  const accent = rotateHex(scheme.accent, deg)
  const thumbTint = rotateHex(scheme.thumbTint, deg)
  // accentGlow 从新 accent 派生
  const ar = parseInt(accent.slice(1, 3), 16)
  const ag = parseInt(accent.slice(3, 5), 16)
  const ab = parseInt(accent.slice(5, 7), 16)
  const accentGlow = `rgba(${ar},${ag},${ab},0.42)`
  return { ...scheme, bg, bgEnd, accent, thumbTint, accentGlow }
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
    // Morning: 天空蓝 + 海沫绿，冷色衬出橙红主角
    return {
      bg: "#C8E8FF",
      bgEnd: "#B4EED8",
      accent: "#38BDF8",
      accentGlow: "rgba(56,189,248,0.4)",
      text: "#0C4A6E",
      thumbTint: "#7DD3FC",
    }
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: 丁香紫 + 薄荷，低饱和对比色让橙红跳跃
    return {
      bg: "#C4B5FD",
      bgEnd: "#A7F3D0",
      accent: "#818CF8",
      accentGlow: "rgba(129,140,248,0.45)",
      text: "#2E1065",
      thumbTint: "#C7D2FE",
    }
  } else if (hour >= 17 && hour < 21) {
    // Evening: 深海蓝 + 靛紫，像灯塔映衬橙红
    return {
      bg: "#1E3A5F",
      bgEnd: "#3B1F6A",
      accent: "#60A5FA",
      accentGlow: "rgba(96,165,250,0.45)",
      text: "#FFFFFF",
      thumbTint: "#93C5FD",
    }
  } else {
    // Night: electric purple + deep violet（告别压抑深蓝，换成多巴胺紫）
    return {
      bg: "#9B35E8",
      bgEnd: "#5B21B6",
      accent: "#F5D0FE",
      accentGlow: "rgba(245,208,254,0.45)",
      text: "#FFFFFF",
      thumbTint: "#F0ABFC",
    }
  }
}

export function useVibeColor(day: number = 0) {
  const [colors, setColors] = useState<VibeColorScheme>(() =>
    computeVibeColor(new Date().getHours())
  )

  useEffect(() => {
    const update = () => setColors(computeVibeColor(new Date().getHours()))
    // refresh every minute
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return applyDailyShift(colors, day)
}

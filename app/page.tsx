"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useVibeColor } from "@/hooks/useVibeColor"
import { useStreak } from "@/hooks/useStreak"
// motion is used for ambient orbs below
import PuffyThumb from "@/components/PuffyThumb"
import PosterModal from "@/components/PosterModal"
import SelfieMode from "@/components/SelfieMode"

export default function Home() {
  const colors = useVibeColor()
  const { day, checkIn } = useStreak()
  const [mode, setMode] = useState<"idle" | "poster" | "selfie" | "photo">("idle")
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>()

  const handleShortPress = () => {
    checkIn()
    setMode("poster")
  }
  const handleLongPress = () => {
    checkIn()
    setMode("selfie")
  }

  const handleCapture = (dataUrl: string) => {
    setCapturedPhoto(dataUrl)
    setMode("photo")
  }

  const handleClose = () => {
    setMode("idle")
    setCapturedPhoto(undefined)
  }

  return (
    <main
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${colors.bg} 0%, ${colors.bgEnd} 100%)` }}
    >
      {/* DAY ghost text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <span
          className="font-black leading-none"
          style={{
            fontSize: "clamp(5rem, 22vw, 18rem)",
            color: "rgba(255,255,255,0.07)",
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
          }}
        >
          DAY
        </span>
        <span
          className="font-black"
          style={{
            fontSize: "clamp(6rem, 30vw, 24rem)",
            color: "rgba(255,255,255,0.07)",
            letterSpacing: "-0.05em",
            lineHeight: 0.85,
          }}
        >
          {day}
        </span>
      </div>

      {/* Ambient orbs */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "45vw",
          height: "45vw",
          maxWidth: 420,
          maxHeight: 420,
          background: `radial-gradient(circle, ${colors.accentGlow} 0%, transparent 70%)`,
          top: "-10%",
          right: "-10%",
          filter: "blur(60px)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "35vw",
          height: "35vw",
          maxWidth: 320,
          maxHeight: 320,
          background: `radial-gradient(circle, ${colors.bg} 0%, transparent 70%)`,
          bottom: "-8%",
          left: "-8%",
          filter: "blur(50px)",
          opacity: 0.5,
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Main */}
      <div className="relative z-10 flex items-center justify-center">
        <PuffyThumb
          day={day}
          colors={colors}
          onShortPress={handleShortPress}
          onLongPress={handleLongPress}
        />
      </div>

      <SelfieMode
        open={mode === "selfie"}
        colors={colors}
        onCapture={handleCapture}
        onClose={handleClose}
      />
      <PosterModal
        open={mode === "poster" || mode === "photo"}
        day={day}
        colors={colors}
        photo={mode === "photo" ? capturedPhoto : undefined}
        onClose={handleClose}
      />
    </main>
  )
}

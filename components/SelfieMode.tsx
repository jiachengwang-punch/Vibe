"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VibeColorScheme } from "@/hooks/useVibeColor"

interface SelfieProps {
  open: boolean
  colors: VibeColorScheme
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export default function SelfieMode({ open, colors, onCapture, onClose }: SelfieProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setReady(false)
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play()
            setReady(true)
          }
        }
      })
      .catch(() => onClose())
  }, [open, onClose])

  const capture = () => {
    if (!videoRef.current || !ready) return
    setFlash(true)
    setTimeout(() => setFlash(false), 250)

    const v = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext("2d")!
    // Mirror horizontally (selfie feel)
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(v, 0, 0)
    onCapture(canvas.toDataURL("image/jpeg", 0.92))
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.25 }}
        >
          {/* Flash overlay */}
          {flash && <div className="absolute inset-0 z-50 bg-white pointer-events-none" />}

          {/* Viewfinder */}
          <div className="relative w-full max-w-sm aspect-[3/4] overflow-hidden rounded-3xl">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              playsInline
              muted
            />
            {/* 👍 stamp preview overlay */}
            <div className="absolute bottom-6 right-6 text-6xl opacity-80 pointer-events-none"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
              👍
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-10 mt-8">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            >
              取消
            </button>

            {/* Shutter */}
            <button
              onClick={capture}
              disabled={!ready}
              className="w-20 h-20 rounded-full transition-all active:scale-90"
              style={{
                background: ready ? colors.accent : "rgba(255,255,255,0.2)",
                boxShadow: ready ? `0 0 0 4px rgba(255,255,255,0.25), 0 8px 32px ${colors.accentGlow}` : "none",
              }}
            />

            {/* spacer */}
            <div className="w-12 h-12" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

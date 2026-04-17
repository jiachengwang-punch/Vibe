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
  const [camError, setCamError] = useState(false)

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setReady(false)
      setCamError(false)
      return
    }

    // 不限制 facingMode，提升 Android 兼容性
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
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
      .catch(() => {
        // 显示错误状态而不是立刻 onClose()
        // 让用户主动点"关闭"，保证 touchend 能正常走完 useLongPress 的 reset 流程
        setCamError(true)
      })
  }, [open])

  const capture = () => {
    if (!videoRef.current || !ready) return
    setFlash(true)
    setTimeout(() => setFlash(false), 250)

    const v = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext("2d")!
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
          transition={{ duration: 0.2 }}
        >
          {flash && <div className="absolute inset-0 z-50 bg-white pointer-events-none" />}

          {camError ? (
            /* 错误状态：让用户主动关闭，不自动消失 */
            <div className="flex flex-col items-center gap-6 px-8 text-center">
              <span style={{ fontSize: 64 }}>📷</span>
              <p className="text-white text-lg font-semibold">无法访问摄像头</p>
              <p className="text-white/50 text-sm">请在系统设置中允许浏览器使用摄像头，然后重试。</p>
              <button
                onClick={onClose}
                className="mt-2 px-8 py-3 rounded-2xl font-semibold text-sm"
                style={{ background: colors.accent, color: "#fff" }}
              >
                关闭
              </button>
            </div>
          ) : (
            <>
              {/* 取景框 */}
              <div className="relative w-full max-w-sm aspect-[3/4] overflow-hidden rounded-3xl">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                  playsInline
                  muted
                />
                <div
                  className="absolute bottom-6 right-6 text-6xl opacity-80 pointer-events-none"
                  style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
                >
                  👍
                </div>
              </div>

              {/* 操作栏 */}
              <div className="flex items-center gap-10 mt-8">
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                >
                  取消
                </button>

                <button
                  onClick={capture}
                  disabled={!ready}
                  className="w-20 h-20 rounded-full transition-all active:scale-90"
                  style={{
                    background: ready ? colors.accent : "rgba(255,255,255,0.2)",
                    boxShadow: ready
                      ? `0 0 0 4px rgba(255,255,255,0.25), 0 8px 32px ${colors.accentGlow}`
                      : "none",
                  }}
                />

                <div className="w-12 h-12" />
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

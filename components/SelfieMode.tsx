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
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)
  const [camError, setCamError] = useState(false)

  // Effect 1：请求摄像头权限，open 变化时触发
  useEffect(() => {
    if (!open) {
      // 关闭时停止所有轨道
      stream?.getTracks().forEach((t) => t.stop())
      setStream(null)
      setReady(false)
      setCamError(false)
      return
    }

    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
        setStream(s)
      })
      .catch(() => {
        if (!cancelled) setCamError(true)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Effect 2：stream 就绪后绑定到 video 元素
  // 此时 React 已完成 commit，videoRef.current 必然存在
  useEffect(() => {
    if (!stream || !videoRef.current) return
    const video = videoRef.current
    video.srcObject = stream

    const onReady = () => setReady(true)
    video.addEventListener("canplay", onReady, { once: true })

    // 如果 canplay 在监听器注册前已经触发（readyState >= 3 = HAVE_FUTURE_DATA）
    if (video.readyState >= 3) {
      setReady(true)
    } else {
      video.play().catch(() => {})
    }

    return () => video.removeEventListener("canplay", onReady)
  }, [stream])

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
                {/* 摄像头加载中提示 */}
                {!ready && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/40 text-sm tracking-widest">加载中…</span>
                  </div>
                )}
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

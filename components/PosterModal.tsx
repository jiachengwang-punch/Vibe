"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VibeColorScheme } from "@/hooks/useVibeColor"
import { generatePoster } from "@/lib/posterCanvas"

interface PosterModalProps {
  open: boolean
  day: number
  colors: VibeColorScheme
  photo?: string
  onClose: () => void
}

export default function PosterModal({ open, day, colors, photo, onClose }: PosterModalProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) { setPosterUrl(null); return }
    generatePoster({ day, vibeColors: colors, photo }).then(setPosterUrl)
  }, [open, day, colors, photo])

  const handleSave = () => {
    if (!posterUrl) return
    setSaving(true)
    const a = document.createElement("a")
    a.href = posterUrl
    a.download = `vibe-day${day}.png`
    a.click()
    setTimeout(() => setSaving(false), 1200)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景蒙层 */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(24px)" }}
            onClick={onClose}
          />

          {/* 内容卡片 */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-5"
            initial={{ scale: 0.82, y: 36, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* 海报预览 */}
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ width: "min(75vw, 340px)", aspectRatio: "1/1" }}
            >
              {posterUrl ? (
                <img src={posterUrl} alt="Vibe 海报" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-3"
                  style={{ background: `linear-gradient(135deg, ${colors.bg}, ${colors.bgEnd})` }}
                >
                  <span className="text-5xl animate-pulse">👍</span>
                  <span
                    className="text-xs tracking-widest uppercase font-medium"
                    style={{ color: colors.text, opacity: 0.4 }}
                  >
                    生成中…
                  </span>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!posterUrl}
                className="px-8 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                style={{
                  background: colors.accent,
                  color: "#fff",
                  boxShadow: `0 4px 24px ${colors.accentGlow}`,
                  opacity: posterUrl ? 1 : 0.45,
                }}
              >
                {saving ? "已保存 ✓" : "保存海报"}
              </button>
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl font-semibold text-sm"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: colors.text,
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                关闭
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

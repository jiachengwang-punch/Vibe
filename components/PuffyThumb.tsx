"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useAnimation } from "framer-motion"
import { useLongPress } from "@/hooks/useLongPress"
import { useCursorKinetics } from "@/hooks/useCursorKinetics"
import { useHaptic } from "@/hooks/useHaptic"
import { VibeColorScheme } from "@/hooks/useVibeColor"

// ── 材质阶段 ──────────────────────────────────────────────────
type ThumbStage = "rubber" | "latex" | "metal" | "jelly"

function getStage(day: number): ThumbStage {
  if (day <= 7) return "rubber"
  if (day <= 99) return "latex"
  if (day <= 364) return "metal"
  return "jelly"
}


// 短按时的充气"砰"声
function playPopSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ac = new AudioCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(540, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(85, ac.currentTime + 0.15)
    gain.gain.setValueAtTime(0.2, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + 0.18)
  } catch {}
}

// ── Props ─────────────────────────────────────────────────────
interface PuffyThumbProps {
  day: number
  colors: VibeColorScheme
  onShortPress: () => void
  onLongPress: () => void
  restartKey?: number
}

export default function PuffyThumb({ day, colors, onShortPress, onLongPress, restartKey = 0 }: PuffyThumbProps) {
  const [pressProgress, setPressProgress] = useState(0)
  const isAnimating = useRef(false)
  const { pop: hapticPop, pumpStart, pumpStop } = useHaptic()
  const { containerRef, tiltX, tiltY } = useCursorKinetics()
  const scaleControls = useAnimation()

  const stage = getStage(day)
  // 雾面橡胶气不足，体积稍小
  const baseScale = stage === "rubber" ? 0.88 : 1.0

  // 呼吸动效：通过 controls 管理，这样 pop 可以无缝打断它
  const startBreathing = useCallback(async () => {
    // 先瞬间恢复可见状态（防止 fly 动效的 opacity:0 被 repeat 循环重放）
    await scaleControls.start({
      opacity: 1,
      scale: baseScale,
      transition: { duration: 0.01 },
    })
    // 纯 scale 呼吸，不带 opacity，避免 repeat 时把透明度一起循环
    scaleControls.start({
      scale: [baseScale, baseScale * 1.04, baseScale],
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
    })
  }, [scaleControls, baseScale])

  useEffect(() => {
    startBreathing()
  }, [startBreathing])

  useEffect(() => {
    if (restartKey === 0) return
    isAnimating.current = false
    startBreathing()
  }, [restartKey, startBreathing])

  // ── 短按：充气弹起 → 飞入海报 ────────────────────────────
  const handleShortPress = async () => {
    if (isAnimating.current) return
    isAnimating.current = true

    hapticPop()
    playPopSound()
    scaleControls.stop()

    // 弹起序列："吸气" → 被压扁 → 弹回 → 稳定
    await scaleControls.start({ scale: 1.16, transition: { duration: 0.08, ease: "easeOut" } })
    await scaleControls.start({ scale: 0.84, transition: { duration: 0.10, ease: "easeIn" } })
    await scaleControls.start({ scale: 1.10, transition: { duration: 0.11, ease: "easeOut" } })
    await scaleControls.start({ scale: 0.97, transition: { duration: 0.08 } })

    // 缩小飞入海报中心
    scaleControls.start({
      scale: 0.06,
      opacity: 0,
      transition: { duration: 0.22, ease: "easeIn" },
    })

    // 触发海报
    setTimeout(() => onShortPress(), 190)

    // 海报打开后重置（模态覆盖了大拇指，视觉上无缝）
    setTimeout(() => {
      isAnimating.current = false
      startBreathing()
    }, 750)
  }

  // ── 长按：松手后弹回 ──────────────────────────────────────
  const handleLongPress = () => {
    pumpStop()
    setPressProgress(0)
    onLongPress()
  }

  const handlers = useLongPress({
    onShortPress: handleShortPress,
    onLongPress: handleLongPress,
    onLongPressProgress: (p) => {
      setPressProgress(p)
      if (p > 0 && p < 0.06) pumpStart()
      if (p === 0) pumpStop()
    },
    threshold: 650,
  })

  // 长按捏扁效果：Y 轴压缩，X 轴膨胀
  const squishX = 1 + pressProgress * 0.30
  const squishY = 1 - pressProgress * 0.30

  // 各阶段 CSS filter：三层 drop-shadow 叠出充气体积感
  const EMOJI_FILTER: Record<ThumbStage, string> = {
    rubber:
      "saturate(0.28) brightness(0.84) drop-shadow(0 2px 0 rgba(0,0,0,0.28)) drop-shadow(0 6px 10px rgba(0,0,0,0.16)) drop-shadow(0 16px 28px rgba(0,0,0,0.10))",
    latex:
      "saturate(1.25) brightness(1.10) drop-shadow(0 3px 0 rgba(0,0,0,0.32)) drop-shadow(0 10px 18px rgba(0,0,0,0.22)) drop-shadow(0 28px 48px rgba(0,0,0,0.14))",
    metal:
      "saturate(0.06) brightness(1.72) contrast(1.28) drop-shadow(0 3px 0 rgba(0,0,0,0.35)) drop-shadow(0 10px 20px rgba(180,180,200,0.45)) drop-shadow(0 28px 50px rgba(150,150,180,0.22))",
    jelly:
      "brightness(1.14) saturate(0.45) opacity(0.76) drop-shadow(0 3px 0 rgba(100,0,200,0.22)) drop-shadow(0 10px 20px rgba(120,60,255,0.30)) drop-shadow(0 28px 48px rgba(80,0,200,0.16))",
  }

  // 光晕颜色
  const GLOW: Record<ThumbStage, string> = {
    rubber: "rgba(140,140,140,0.22)",
    latex: colors.accentGlow,
    metal: "rgba(210,210,225,0.32)",
    jelly: "rgba(120,60,255,0.28)",
  }

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-80 h-80 select-none">

      {/* 环境光晕 */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "210px",
          height: "210px",
          background: `radial-gradient(circle, ${GLOW[stage]} 0%, transparent 70%)`,
          filter: `blur(${28 + pressProgress * 24}px)`,
        }}
        animate={{ scale: [1, 1.10, 1], opacity: [0.65, 1.0, 0.65] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Y 轴浮动（独立层，始终运行） */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 缩放（呼吸 + 弹起，由 controls 管理）+ 3D 倾斜 */}
        <motion.div
          animate={scaleControls}
          style={{
            rotateX: tiltX,
            rotateY: tiltY,
            transformStyle: "preserve-3d",
            perspective: 800,
            cursor: "pointer",
            position: "relative",
          }}
          {...handlers}
        >
          {/* 长按捏扁层 */}
          <motion.div style={{ scaleX: squishX, scaleY: squishY }}>

            {/* Emoji + 材质叠层 */}
            <div style={{ position: "relative", display: "inline-block", fontSize: 0, lineHeight: 0 }}>
              <span
                style={{
                  fontSize: stage === "rubber" ? "144px" : stage === "latex" ? "164px" : "158px",
                  lineHeight: stage === "rubber" ? "144px" : stage === "latex" ? "164px" : "158px",
                  display: "block",
                  filter: EMOJI_FILTER[stage],
                }}
              >
                👍
              </span>
              {/* rubber 无高光（雾面不反光） */}
              {stage === "latex" && <LatexGloss />}
              {stage === "metal" && <MetalShimmer />}
              {stage === "jelly" && <JellyRainbow />}
            </div>

          </motion.div>

          {/* 长按进度环 */}
          {pressProgress > 0 && (
            <svg
              className="absolute pointer-events-none"
              style={{
                width: 164, height: 164,
                left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              viewBox="0 0 164 164"
            >
              <circle
                cx="82" cy="82" r="74"
                fill="none"
                stroke={colors.accent}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 74}`}
                strokeDashoffset={`${2 * Math.PI * 74 * (1 - pressProgress)}`}
                transform="rotate(-90 82 82)"
                style={{ filter: `drop-shadow(0 0 6px ${colors.accent})` }}
              />
            </svg>
          )}
        </motion.div>
      </motion.div>

      {/* 底部提示 */}
      <motion.p
        className="absolute bottom-0 text-xs tracking-widest font-medium pointer-events-none"
        style={{ color: colors.text, letterSpacing: "0.2em" }}
        animate={{ opacity: [0.32, 0.52, 0.32] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        长按拍照
      </motion.p>
    </div>
  )
}

// ── 材质叠层 ──────────────────────────────────────────────────

/** 高光乳胶：左上角强高光 */
function LatexGloss() {
  return (
    <>
      {/* 主高光：screen 混合比 overlay 更亮，更像气球反光 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 58% 48% at 31% 20%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.38) 28%, transparent 52%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 底部暗边：增强球体弧面感 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 62% 82%, rgba(0,0,0,0.18) 0%, transparent 55%)",
          mixBlendMode: "multiply",
        }}
      />
    </>
  )
}

/** 液态金属：静态高光 + 扫光动画 */
function MetalShimmer() {
  return (
    <>
      {/* 静态镜面 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 54% 44% at 37% 25%, rgba(255,255,255,0.64) 0%, rgba(255,255,255,0.06) 48%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 扫光 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 4 }}>
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(108deg, transparent 20%, rgba(255,255,255,0.65) 50%, transparent 80%)",
            mixBlendMode: "screen",
          }}
          animate={{ x: ["-130%", "230%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 1.8 }}
        />
      </div>
    </>
  )
}

/** 幻彩果冻：旋转彩虹 conic-gradient */
function JellyRainbow() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "conic-gradient(from 0deg, rgba(255,55,55,0.30), rgba(255,200,0,0.30), rgba(55,255,120,0.30), rgba(30,145,255,0.30), rgba(200,30,255,0.30), rgba(255,55,55,0.30))",
        mixBlendMode: "screen",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    />
  )
}

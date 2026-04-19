"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useAnimation } from "framer-motion"
import { useLongPress } from "@/hooks/useLongPress"
import { useCursorKinetics } from "@/hooks/useCursorKinetics"
import { useHaptic } from "@/hooks/useHaptic"
import { VibeColorScheme } from "@/hooks/useVibeColor"

// ── 暖色演化阶段 ──────────────────────────────────────────────
// line   Day 1-7  ：香槟金线条，若隐若现
// amber  Day 8-21 ：琥珀半透，光能穿过
// solid  Day 22+  ：充气实体，橙红 3D 奖杯
type ThumbStage = "line" | "amber" | "solid"

function getStage(day: number): ThumbStage {
  if (day <= 7) return "line"
  if (day <= 21) return "amber"
  return "solid"
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
  // line 阶段体积最小，随天数充气长大
  const baseScale = stage === "line" ? 0.84 : stage === "amber" ? 0.94 : 1.0

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

  // 各阶段 filter：暖色轴演化
  const EMOJI_FILTER: Record<ThumbStage, string> = {
    // 香槟金线条：高亮度低饱和，像通电的细霓虹
    line:
      "saturate(0.18) brightness(2.1) drop-shadow(0 0 8px rgba(251,215,134,0.9)) drop-shadow(0 4px 14px rgba(251,215,134,0.55)) drop-shadow(0 12px 28px rgba(251,215,134,0.28))",
    // 琥珀半透：暖饱和度提升，光能穿过
    amber:
      "saturate(1.45) brightness(1.12) hue-rotate(-10deg) drop-shadow(0 3px 0 rgba(255,126,95,0.45)) drop-shadow(0 10px 20px rgba(255,100,70,0.32)) drop-shadow(0 28px 48px rgba(255,80,50,0.18))",
    // 充气实体：强饱和 + 偏红，厚重 3D 奖杯感
    solid:
      "saturate(2.4) brightness(0.92) hue-rotate(-20deg) contrast(1.18) drop-shadow(0 4px 0 rgba(200,30,20,0.45)) drop-shadow(0 14px 26px rgba(255,78,80,0.40)) drop-shadow(0 32px 56px rgba(255,78,80,0.22))",
  }

  // 环境光晕颜色
  const GLOW: Record<ThumbStage, string> = {
    line: "rgba(251,215,134,0.32)",
    amber: "rgba(255,126,95,0.38)",
    solid: "rgba(255,65,108,0.35)",
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
                  fontSize: stage === "line" ? "138px" : stage === "amber" ? "152px" : "164px",
                  lineHeight: stage === "line" ? "138px" : stage === "amber" ? "152px" : "164px",
                  display: "block",
                  filter: EMOJI_FILTER[stage],
                }}
              >
                👍
              </span>
              {stage === "line" && <LineNeon />}
              {stage === "amber" && <AmberJelly />}
              {stage === "solid" && <SolidFlame />}
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

// ── 暖色叠层 ──────────────────────────────────────────────────

/** 香槟金霓虹：柔和的金色内发光，若隐若现 */
function LineNeon() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 62% 54% at 38% 26%, rgba(253,235,160,0.82) 0%, rgba(253,220,120,0.38) 38%, transparent 60%)",
        mixBlendMode: "screen",
      }}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

/** 琥珀果冻：暖橙半透，光穿过 + 细白高光边 */
function AmberJelly() {
  return (
    <>
      {/* 琥珀暖光 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 36% 24%, rgba(255,185,120,0.60) 0%, rgba(255,130,85,0.32) 44%, transparent 65%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 白色细高光 — 像被阳光勾过的边 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 38% 28% at 28% 16%, rgba(255,255,255,0.62) 0%, transparent 58%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 底部轻暗边，增加果冻弧面感 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 58% 45% at 60% 84%, rgba(180,60,20,0.16) 0%, transparent 55%)",
          mixBlendMode: "multiply",
        }}
      />
    </>
  )
}

/** 充气实体：右上角白色光源 + 橙红弥散阴影 */
function SolidFlame() {
  return (
    <>
      {/* 右上角主光源：让大色块变成"奖杯"不是"图案" */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 48% 40% at 70% 14%, rgba(255,255,255,0.78) 0%, rgba(255,225,100,0.42) 28%, transparent 55%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 底部热红暗边：强化 3D 充气球体感 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 62% 52% at 48% 88%, rgba(160,20,20,0.24) 0%, transparent 58%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* 弥散光晕（在 emoji 下方 40px 扩散） */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "20px -20px -40px -20px",
          background:
            "radial-gradient(ellipse 70% 50% at 50% 85%, rgba(255,78,80,0.28) 0%, transparent 65%)",
          filter: "blur(12px)",
          mixBlendMode: "normal",
        }}
      />
    </>
  )
}

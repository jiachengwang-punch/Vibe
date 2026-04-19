"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { useLongPress } from "@/hooks/useLongPress"
import { useCursorKinetics } from "@/hooks/useCursorKinetics"
import { useHaptic } from "@/hooks/useHaptic"
import { VibeColorScheme } from "@/hooks/useVibeColor"

// ── 三段演化 ──────────────────────────────────────────────────
// sprout  Day 1-7  ：幽灵线条，若隐若现
// frosted Day 8-21 ：磨砂琥珀果冻，光可穿透
// crystal Day 22+  ：晶体琥珀实体，沉甸甸的勋章感
type ThumbStage = "sprout" | "frosted" | "crystal"

function getStage(day: number): ThumbStage {
  if (day <= 7) return "sprout"
  if (day <= 21) return "frosted"
  return "crystal"
}

// ── 金屑粒子（模块级固定，避免每次 render 重新随机）────────────
const BURST_PARTICLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
  (deg, i) => ({
    angle: (deg * Math.PI) / 180,
    dist: i % 2 === 0 ? 58 : 44,
    size: i % 3 === 0 ? 3.5 : i % 3 === 1 ? 2.5 : 2,
    delay: i * 0.018,
  })
)

// ── 短按音效 ──────────────────────────────────────────────────
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
  burstKey?: number
}

export default function PuffyThumb({
  day,
  colors,
  onShortPress,
  onLongPress,
  restartKey = 0,
  burstKey = 0,
}: PuffyThumbProps) {
  const [pressProgress, setPressProgress] = useState(0)
  const [showBurst, setShowBurst] = useState(false)
  const isAnimating = useRef(false)
  const { pop: hapticPop, pumpStart, pumpStop } = useHaptic()
  const { containerRef, tiltX, tiltY } = useCursorKinetics()
  const scaleControls = useAnimation()

  const stage = getStage(day)
  const baseScale = stage === "sprout" ? 0.84 : stage === "frosted" ? 0.93 : 1.0

  // ── 呼吸动效 ─────────────────────────────────────────────────
  const startBreathing = useCallback(async () => {
    await scaleControls.start({
      opacity: 1,
      scale: baseScale,
      transition: { duration: 0.01 },
    })
    scaleControls.start({
      scale: [baseScale, baseScale * 1.04, baseScale],
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
    })
  }, [scaleControls, baseScale])

  useEffect(() => { startBreathing() }, [startBreathing])

  useEffect(() => {
    if (restartKey === 0) return
    isAnimating.current = false
    startBreathing()
  }, [restartKey, startBreathing])

  // ── burstKey → 金屑爆炸 ──────────────────────────────────────
  useEffect(() => {
    if (burstKey === 0) return
    setShowBurst(true)
    setTimeout(() => setShowBurst(false), 700)
  }, [burstKey])

  // ── 短按：充气弹起 → 飞入海报 ────────────────────────────────
  const handleShortPress = async () => {
    if (isAnimating.current) return
    isAnimating.current = true

    hapticPop()
    playPopSound()
    scaleControls.stop()

    await scaleControls.start({ scale: 1.16, transition: { duration: 0.08, ease: "easeOut" } })
    await scaleControls.start({ scale: 0.84, transition: { duration: 0.10, ease: "easeIn" } })
    await scaleControls.start({ scale: 1.10, transition: { duration: 0.11, ease: "easeOut" } })
    await scaleControls.start({ scale: 0.97, transition: { duration: 0.08 } })

    scaleControls.start({
      scale: 0.06,
      opacity: 0,
      transition: { duration: 0.22, ease: "easeIn" },
    })

    setTimeout(() => onShortPress(), 190)
    setTimeout(() => {
      isAnimating.current = false
      startBreathing()
    }, 750)
  }

  // ── 长按：松手后触发 ──────────────────────────────────────────
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

  // 长按：Y 轴压缩（捏扁）+ 饱和度蓄力
  const squishX = 1 + pressProgress * 0.30
  const squishY = 1 - pressProgress * 0.30
  const satBoost = pressProgress > 0 ? `saturate(${1 + pressProgress * 0.22}) ` : ""

  // ── 各阶段 emoji filter ────────────────────────────────────────
  const EMOJI_FILTER: Record<ThumbStage, string> = {
    // 灰蓝幽灵：去色 + 蓝移 + 半透，像细描轮廓
    sprout:
      "saturate(0.06) hue-rotate(195deg) brightness(1.65) opacity(0.50) " +
      "drop-shadow(0 0 7px rgba(171,178,191,0.65)) drop-shadow(0 4px 14px rgba(171,178,191,0.30))",
    // 磨砂琥珀：暖饱和 + 略降透明度，光可穿透
    frosted:
      "saturate(1.15) brightness(1.08) hue-rotate(-6deg) opacity(0.80) " +
      "drop-shadow(0 3px 0 rgba(255,140,95,0.38)) drop-shadow(0 10px 22px rgba(255,115,70,0.26)) drop-shadow(0 26px 44px rgba(255,90,50,0.14))",
    // 晶体琥珀：高饱和 + 暖偏 + 强阴影，沉甸甸的实体勋章
    crystal:
      "saturate(1.55) brightness(0.97) hue-rotate(-13deg) contrast(1.10) " +
      "drop-shadow(0 4px 2px rgba(200,60,20,0.40)) drop-shadow(0 14px 28px rgba(255,100,60,0.34)) drop-shadow(0 30px 52px rgba(255,80,40,0.20))",
  }

  // ── 环境光晕 ──────────────────────────────────────────────────
  const GLOW: Record<ThumbStage, string> = {
    sprout: "rgba(171,178,191,0.22)",
    frosted: "rgba(255,140,95,0.32)",
    crystal: "rgba(255,100,55,0.38)",
  }

  const emojiSize: Record<ThumbStage, string> = {
    sprout: "138px",
    frosted: "152px",
    crystal: "164px",
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

      {/* Y 轴浮动 */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 缩放 + 3D 倾斜 */}
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
          {/* 长按捏扁 */}
          <motion.div style={{ scaleX: squishX, scaleY: squishY }}>

            {/* 饱和度蓄力包裹层 */}
            <div style={{ filter: satBoost || undefined }}>

              {/* Emoji + 材质叠层 */}
              <div style={{ position: "relative", display: "inline-block", fontSize: 0, lineHeight: 0 }}>
                <span
                  style={{
                    fontSize: emojiSize[stage],
                    lineHeight: emojiSize[stage],
                    display: "block",
                    filter: EMOJI_FILTER[stage],
                  }}
                >
                  👍
                </span>
                {stage === "sprout"  && <SproutGhost />}
                {stage === "frosted" && <FrostedAmber />}
                {stage === "crystal" && <CrystalAmber />}
              </div>

            </div>

          </motion.div>

          {/* 长按进度环 */}
          {pressProgress > 0 && (
            <svg
              className="absolute pointer-events-none"
              style={{ width: 164, height: 164, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              viewBox="0 0 164 164"
            >
              <circle
                cx="82" cy="82" r="74"
                fill="none"
                stroke="#FEB47B"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 74}`}
                strokeDashoffset={`${2 * Math.PI * 74 * (1 - pressProgress)}`}
                transform="rotate(-90 82 82)"
                style={{ filter: "drop-shadow(0 0 6px rgba(255,180,100,0.8))" }}
              />
            </svg>
          )}

          {/* 金屑爆炸 */}
          <GoldBurst active={showBurst} />

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

/** 萌芽期：幽灵灰蓝高光，隐约发光 */
function SproutGhost() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 50% 42% at 38% 26%, rgba(171,178,191,0.40) 0%, transparent 58%)",
        mixBlendMode: "screen",
      }}
      animate={{ opacity: [0.38, 0.72, 0.38] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

/** 塑形期：磨砂琥珀，暖橙半透 + 细白高光弧 */
function FrostedAmber() {
  return (
    <>
      {/* 暖橙半透主体 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 68% 58% at 44% 38%, rgba(255,155,105,0.46) 0%, rgba(254,180,123,0.22) 52%, transparent 72%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 白色细高光弧：像被阳光勾过的边缘 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 32% 24% at 29% 17%, rgba(255,255,255,0.55) 0%, transparent 56%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 底部轻暗边 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 56% 44% at 58% 86%, rgba(170,55,15,0.14) 0%, transparent 55%)",
          mixBlendMode: "multiply",
        }}
      />
    </>
  )
}

/** 铸魂期：晶体琥珀，右上角水晶光源 + 香槟金内发光 + 弥散阴影 */
function CrystalAmber() {
  return (
    <>
      {/* 右上角水晶主光源 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 42% 34% at 72% 13%, rgba(255,255,255,0.62) 0%, rgba(255,240,180,0.30) 32%, transparent 56%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 香槟金内发光：模拟琥珀内部微光 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 58% 50% at 48% 50%, rgba(251,215,134,0.28) 0%, rgba(251,215,134,0.06) 58%, transparent 74%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 底部热红暗边：强化 3D 体积感 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 46% at 50% 92%, rgba(155,35,10,0.22) 0%, transparent 58%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* 弥散漂浮阴影 rgba(255,126,95,0.2) */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "28px -22px -46px -22px",
          background:
            "radial-gradient(ellipse 66% 44% at 50% 82%, rgba(255,126,95,0.28) 0%, transparent 66%)",
          filter: "blur(16px)",
        }}
      />
    </>
  )
}

// ── 金屑爆炸特效 ──────────────────────────────────────────────
function GoldBurst({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active &&
        BURST_PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              background: i % 2 === 0 ? "rgba(251,215,134,0.95)" : "rgba(255,200,100,0.90)",
              left: "50%",
              top: "50%",
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              boxShadow: `0 0 ${p.size * 2.5}px rgba(251,200,80,0.9)`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(p.angle) * p.dist,
              y: Math.sin(p.angle) * p.dist,
              opacity: 0,
              scale: 0.2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, delay: p.delay, ease: "easeOut" }}
          />
        ))}
    </AnimatePresence>
  )
}

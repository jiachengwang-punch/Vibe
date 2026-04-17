import { VibeColorScheme } from "@/hooks/useVibeColor"
import { pickQuote } from "@/lib/quotes"

// ── 莫兰迪色系调色板 ──────────────────────────────────────────
const MORANDI: Array<{ bg: string; bgEnd: string; accent: string; text: string }> = [
  { bg: "#DDD5C8", bgEnd: "#B8C4B8", accent: "#6B8C6B", text: "#2E2420" },
  { bg: "#C8BED4", bgEnd: "#9EAAB8", accent: "#7A7AAA", text: "#1E1C2E" },
  { bg: "#D4BEB0", bgEnd: "#C8A882", accent: "#9A6848", text: "#2E1E14" },
  { bg: "#B8C8C4", bgEnd: "#D4C4A8", accent: "#4E8888", text: "#142020" },
  { bg: "#D4C8B4", bgEnd: "#B8B0A4", accent: "#7A7060", text: "#22201A" },
  { bg: "#D0BEC8", bgEnd: "#C0B0B4", accent: "#906880", text: "#2A1420" },
]

function morandiForDay(day: number) {
  return MORANDI[day % MORANDI.length]
}

// ── 天数 → 进化阶段 ───────────────────────────────────────────
type Stage = "outline" | "material" | "jelly" | "glow"

function getStage(day: number): Stage {
  if (day <= 7) return "outline"
  if (day <= 30) return "material"
  if (day < 100) return "jelly"
  return "glow"
}

// ── 工具函数 ──────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function darken(hex: string, amt = 40) {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`
}

// ── 主绘制函数 ────────────────────────────────────────────────
export interface PosterOptions {
  day: number
  vibeColors: VibeColorScheme
  photo?: string
  width?: number
  height?: number
}

export async function generatePoster(opts: PosterOptions): Promise<string> {
  const { day, vibeColors, photo, width = 1080, height = 1080 } = opts
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  if (photo) {
    await drawSelfiePoster(ctx, width, height, day, photo)
  } else {
    await drawGraphicPoster(ctx, width, height, day, vibeColors)
  }

  return canvas.toDataURL("image/png", 1.0)
}

// ── 图形海报（短按） ──────────────────────────────────────────
async function drawGraphicPoster(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  day: number,
  vibeColors: VibeColorScheme
) {
  const stage = getStage(day)
  const morandi = morandiForDay(day)

  // 背景：前7天用莫兰迪，之后混合能量色
  const useMorandi = stage === "outline"
  const bgFrom = useMorandi ? morandi.bg : vibeColors.bg
  const bgTo = useMorandi ? morandi.bgEnd : vibeColors.bgEnd
  const accentHex = useMorandi ? morandi.accent : vibeColors.accent
  const textColor = useMorandi ? morandi.text : vibeColors.text

  // 绘制背景渐变
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, bgFrom)
  bgGrad.addColorStop(1, bgTo)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // 背景细节装饰
  drawBackgroundDetails(ctx, W, H, stage, accentHex)

  const cx = W / 2
  const thumbY = H * 0.40
  const thumbSize = W * 0.38

  // 绘制拇指背景圆
  drawThumbBase(ctx, cx, thumbY, thumbSize * 0.56, stage, accentHex)

  // 绘制 Emoji
  ctx.save()
  ctx.font = `${thumbSize}px serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("👍", cx, thumbY)
  ctx.restore()

  // 发光阶段叠加光晕
  if (stage === "glow") {
    drawGlowOverlay(ctx, cx, thumbY, thumbSize * 0.56, accentHex)
  }

  // DAY 文字
  drawDayText(ctx, W, H, day, stage, textColor, accentHex)

  // 随机语录
  drawQuote(ctx, W, H, day, stage, textColor)
}

// ── 背景装饰 ──────────────────────────────────────────────────
function drawBackgroundDetails(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  stage: Stage,
  accentHex: string
) {
  const { r, g, b } = hexToRgb(accentHex)

  if (stage === "outline") {
    // 极简网格线
    ctx.save()
    ctx.strokeStyle = `rgba(${r},${g},${b},0.08)`
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += W / 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += H / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }
    ctx.restore()
  } else if (stage === "material") {
    // 右上角大圆
    ctx.save()
    ctx.beginPath()
    ctx.arc(W * 1.0, H * 0, W * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},0.12)`
    ctx.fill()
    // 左下角小圆
    ctx.beginPath()
    ctx.arc(0, H, W * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},0.08)`
    ctx.fill()
    ctx.restore()
  } else if (stage === "jelly") {
    // 模糊光晕球
    for (const [ox, oy, radius, alpha] of [
      [0.85, 0.15, 0.35, 0.15],
      [0.1, 0.85, 0.25, 0.1],
    ]) {
      const grad = ctx.createRadialGradient(
        W * ox, H * oy, 0,
        W * ox, H * oy, W * radius
      )
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }
  } else {
    // glow: 深色背景叠深色渐变已在主背景处理，这里加星点
    ctx.save()
    ctx.fillStyle = `rgba(${r},${g},${b},0.6)`
    for (let i = 0; i < 40; i++) {
      const px = Math.random() * W
      const py = Math.random() * H
      const pr = Math.random() * 2.5 + 0.5
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

// ── 拇指背景圆 ────────────────────────────────────────────────
function drawThumbBase(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  stage: Stage,
  accentHex: string
) {
  const { r: ar, g: ag, b: ab } = hexToRgb(accentHex)
  ctx.save()

  if (stage === "outline") {
    // 仅描边圆
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.35)`
    ctx.lineWidth = 3
    ctx.setLineDash([12, 8])
    ctx.stroke()
    // 外圈
    ctx.beginPath()
    ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.12)`
    ctx.lineWidth = 1.5
    ctx.setLineDash([])
    ctx.stroke()

  } else if (stage === "material") {
    // 金属质感填充圆
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r)
    grad.addColorStop(0, `rgba(255,255,255,0.85)`)
    grad.addColorStop(0.35, accentHex)
    grad.addColorStop(1, darken(accentHex, 50))
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    // 金属高光弧
    const sheen = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.4, cy + r * 0.4)
    sheen.addColorStop(0, "rgba(255,255,255,0.55)")
    sheen.addColorStop(0.6, "rgba(255,255,255,0.0)")
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = sheen
    ctx.fill()

  } else if (stage === "jelly") {
    // 果冻：半透明 + 高光
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.18)`
    ctx.fill()
    // 内高光
    const jelly = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.42, 0, cx, cy, r)
    jelly.addColorStop(0, "rgba(255,255,255,0.55)")
    jelly.addColorStop(0.5, "rgba(255,255,255,0.08)")
    jelly.addColorStop(1, `rgba(${ar},${ag},${ab},0.25)`)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = jelly
    ctx.fill()
    // 边缘描边
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,255,255,0.4)`
    ctx.lineWidth = 2.5
    ctx.stroke()

  } else {
    // glow: 多层光环（叠在 emoji 下方）
    for (let i = 4; i >= 0; i--) {
      ctx.beginPath()
      ctx.arc(cx, cy, r * (1 + i * 0.22), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${ar},${ag},${ab},${0.06 - i * 0.008})`
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${ar},${ag},${ab},0.2)`
    ctx.fill()
  }

  ctx.restore()
}

// ── 发光叠加（emoji 上方） ────────────────────────────────────
function drawGlowOverlay(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  accentHex: string
) {
  const { r: ar, g: ag, b: ab } = hexToRgb(accentHex)
  ctx.save()
  ctx.globalCompositeOperation = "screen"
  const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4)
  glowGrad.addColorStop(0, `rgba(${ar},${ag},${ab},0.45)`)
  glowGrad.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
  ctx.fillStyle = glowGrad
  ctx.fillRect(cx - r * 1.5, cy - r * 1.5, r * 3, r * 3)
  ctx.globalCompositeOperation = "source-over"
  ctx.restore()
}

// ── DAY 文字 ──────────────────────────────────────────────────
// 布局：所有阶段共用同一个 Y 轴中心 (H * 0.685)，
// "DAY" 与数字同行，分权重处理，字号统一在 W * 0.092。
function drawDayText(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  stage: Stage,
  textColor: string,
  accentHex: string
) {
  const { r, g, b } = hexToRgb(textColor)
  const { r: ar, g: ag, b: ab } = hexToRgb(accentHex)
  const cy = H * 0.685
  const fontSize = W * 0.092
  const numStr = `${day}`

  ctx.save()
  ctx.textBaseline = "middle"

  // 分隔细线（在文字上方）
  const ruleY = cy - fontSize * 0.92
  ctx.strokeStyle = stage === "outline"
    ? `rgba(${r},${g},${b},0.15)`
    : `rgba(255,255,255,0.18)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W * 0.28, ruleY)
  ctx.lineTo(W * 0.72, ruleY)
  ctx.stroke()

  // 果冻阶段：在文字后面画磨砂底
  if (stage === "jelly") {
    ctx.save()
    const pillW = W * 0.42
    const pillH = fontSize * 1.5
    const px = W / 2 - pillW / 2
    const py = cy - pillH / 2
    ctx.beginPath()
    ;(ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(
      px, py, pillW, pillH, pillH / 2
    )
    ctx.fillStyle = "rgba(255,255,255,0.14)"
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.28)"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  }

  // 测量两段文字宽度，使它们在视觉上居中
  ctx.font = `300 ${fontSize}px Inter, system-ui, sans-serif`
  const dayLabelW = ctx.measureText("DAY ").width
  ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`
  const numW = ctx.measureText(numStr).width
  const totalW = dayLabelW + numW
  const startX = W / 2 - totalW / 2

  // 绘制 "DAY "（轻字重）
  ctx.font = `300 ${fontSize}px Inter, system-ui, sans-serif`
  ctx.textAlign = "left"
  switch (stage) {
    case "outline":
      ctx.fillStyle = `rgba(${r},${g},${b},0.38)`; break
    case "glow":
      ctx.fillStyle = `rgba(255,255,255,0.38)`; break
    default:
      ctx.fillStyle = `rgba(255,255,255,0.42)`
  }
  ctx.fillText("DAY ", startX, cy)

  // 绘制数字（重字重）
  ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`
  if (stage === "glow") {
    ctx.shadowColor = `rgba(${ar},${ag},${ab},0.9)`
    ctx.shadowBlur = 18
    ctx.fillStyle = accentHex
  } else if (stage === "outline") {
    ctx.fillStyle = accentHex
  } else {
    ctx.fillStyle = stage === "jelly"
      ? "rgba(255,255,255,0.9)"
      : "rgba(255,255,255,0.95)"
  }
  ctx.fillText(numStr, startX + dayLabelW, cy)
  ctx.shadowBlur = 0

  ctx.restore()
}

// ── 语录 ──────────────────────────────────────────────────────
function drawQuote(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  stage: Stage,
  textColor: string
) {
  const { r, g, b } = hexToRgb(textColor)
  const quote = pickQuote(day)

  ctx.save()
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `400 ${W * 0.028}px Inter, system-ui, sans-serif`
  ctx.fillStyle = `rgba(${r},${g},${b},0.38)`
  ctx.fillText(quote, W / 2, H * 0.845)
  ctx.restore()

  // 底部品牌标记
  ctx.save()
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `600 ${W * 0.02}px Inter, system-ui, sans-serif`
  ctx.fillStyle = `rgba(${r},${g},${b},0.16)`
  ctx.fillText("VIBE", W / 2, H * 0.935)
  ctx.restore()
}

// ── 自拍海报（长按后拍照） ────────────────────────────────────
async function drawSelfiePoster(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  photo: string
) {
  await new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.max(W / img.width, H / img.height)
      const sw = img.width * scale
      const sh = img.height * scale
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh)
      resolve()
    }
    img.src = photo
  })

  // 顶部渐变遮罩
  const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.3)
  topScrim.addColorStop(0, "rgba(0,0,0,0.45)")
  topScrim.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = topScrim
  ctx.fillRect(0, 0, W, H)

  // 底部渐变遮罩
  const botScrim = ctx.createLinearGradient(0, H * 0.6, 0, H)
  botScrim.addColorStop(0, "rgba(0,0,0,0)")
  botScrim.addColorStop(1, "rgba(0,0,0,0.55)")
  ctx.fillStyle = botScrim
  ctx.fillRect(0, 0, W, H)

  // 👍 印章（右下角）
  const stampSize = W * 0.2
  ctx.save()
  ctx.font = `${stampSize}px serif`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.shadowColor = "rgba(0,0,0,0.4)"
  ctx.shadowBlur = 20
  ctx.fillText("👍", W * 0.92, H * 0.92)
  ctx.restore()

  // DAY 文字（左上）
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.font = `700 ${W * 0.05}px Inter, system-ui, sans-serif`
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText(`DAY ${day}`, W * 0.08, H * 0.07)
  ctx.restore()

  // 语录（底部）
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.font = `400 ${W * 0.032}px Inter, system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "bottom"
  ctx.fillText(pickQuote(day), W / 2, H * 0.94)
  ctx.restore()
}

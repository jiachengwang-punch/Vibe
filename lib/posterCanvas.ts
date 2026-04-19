import { VibeColorScheme } from "@/hooks/useVibeColor"
import { pickQuote } from "@/lib/quotes"

// ── 工具 ─────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`

// ── 噪点纹理 ──────────────────────────────────────────────────
function drawGrain(ctx: CanvasRenderingContext2D, W: number, H: number, count = 5000) {
  ctx.save()
  for (let i = 0; i < count; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(255,255,255,${Math.random() * 0.055})`
      : `rgba(0,0,0,${Math.random() * 0.038})`
    ctx.fillRect(x, y, 1.5, 1.5)
  }
  ctx.restore()
}

// ── 主入口 ────────────────────────────────────────────────────
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

// ── 图形海报：奇数天 → 编辑风，偶数天 → 专辑风 ──────────────
async function drawGraphicPoster(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  colors: VibeColorScheme
) {
  if (day % 2 !== 0) {
    drawEditorialPoster(ctx, W, H, day, colors)
  } else {
    drawAlbumPoster(ctx, W, H, day, colors)
  }
}

// ════════════════════════════════════════════════════════════
// Design A  杂志编辑风
// ════════════════════════════════════════════════════════════
// 上半：右侧幽灵巨数字 + 偏左 emoji
// 下半：水平细线 / 小标签 / 超大天数 / 语录 / VIBE
// ════════════════════════════════════════════════════════════
function drawEditorialPoster(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  colors: VibeColorScheme
) {
  const { r: tr, g: tg, b: tb } = hexToRgb(colors.text)
  const numStr = `${day}`

  // ── 背景渐变 ─────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W * 0.65, H)
  bg.addColorStop(0, colors.bg)
  bg.addColorStop(1, colors.bgEnd)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // ── 噪点 ─────────────────────────────────────────────────
  drawGrain(ctx, W, H, 4200)

  // ── 右侧幽灵巨数字（背景装饰，部分出血）────────────────────
  ctx.save()
  ctx.font = `700 ${W * 0.68}px ${FONT}`
  ctx.textAlign = "right"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.08)`
  ctx.fillText(numStr, W * 0.96, H * 0.50)
  ctx.restore()

  // ── Emoji（偏左，上方）───────────────────────────────────
  ctx.save()
  ctx.font = `${W * 0.36}px serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("👍", W * 0.40, H * 0.295)
  ctx.restore()

  // ── 水平细线 ─────────────────────────────────────────────
  ctx.save()
  ctx.strokeStyle = `rgba(${tr},${tg},${tb},0.20)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W * 0.07, H * 0.570)
  ctx.lineTo(W * 0.93, H * 0.570)
  ctx.stroke()
  ctx.restore()

  // ── 小标签"已经点赞了" ───────────────────────────────────
  ctx.save()
  ctx.font = `300 ${W * 0.038}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.52)`
  ctx.fillText("已经点赞了", W * 0.08, H * 0.648)
  ctx.restore()

  // ── 天数大字 ─────────────────────────────────────────────
  const numFontSize = W * 0.165
  ctx.save()
  ctx.font = `700 ${numFontSize}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},1.0)`
  ctx.fillText(numStr, W * 0.08, H * 0.778)
  // "天" 紧跟数字右侧，字号降至 60%，垂直对齐到数字顶端
  const numMeasure = ctx.measureText(numStr).width
  ctx.font = `300 ${numFontSize * 0.52}px ${FONT}`
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.62)`
  ctx.textBaseline = "alphabetic"
  ctx.fillText("天", W * 0.08 + numMeasure + W * 0.010, H * 0.742)
  ctx.restore()

  // ── 语录 ─────────────────────────────────────────────────
  ctx.save()
  ctx.font = `300 ${W * 0.026}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.40)`
  ctx.fillText(pickQuote(day), W * 0.08, H * 0.882)
  ctx.restore()

  // ── VIBE 品牌 ────────────────────────────────────────────
  ctx.save()
  ctx.font = `600 ${W * 0.017}px ${FONT}`
  ctx.textAlign = "right"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.20)`
  ctx.fillText("VIBE", W * 0.93, H * 0.948)
  ctx.restore()
}

// ════════════════════════════════════════════════════════════
// Design B  黑胶专辑风
// ════════════════════════════════════════════════════════════
// 上半：径向渐变背景 + 大光晕 + 居中 emoji + 双层噪点
// 下半：细线 / "D A Y" 宽字距标签 / 巨型天数 / 语录
// ════════════════════════════════════════════════════════════
function drawAlbumPoster(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  colors: VibeColorScheme
) {
  const { r: tr, g: tg, b: tb } = hexToRgb(colors.text)
  const { r: ar, g: ag, b: ab } = hexToRgb(colors.accent)
  const numStr = `${day}`

  // ── 背景：径向渐变，中心亮，四角深 ─────────────────────────
  const bg = ctx.createRadialGradient(W * 0.50, H * 0.34, 0, W * 0.50, H * 0.50, W * 0.88)
  bg.addColorStop(0, colors.bg)
  bg.addColorStop(1, colors.bgEnd)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // ── 第一层噪点（背景之上）───────────────────────────────────
  drawGrain(ctx, W, H, 5500)

  // ── Emoji 背后大光晕 ─────────────────────────────────────
  ctx.save()
  const glow = ctx.createRadialGradient(W * 0.50, H * 0.30, 0, W * 0.50, H * 0.30, W * 0.56)
  glow.addColorStop(0, `rgba(${ar},${ag},${ab},0.42)`)
  glow.addColorStop(0.45, `rgba(${ar},${ag},${ab},0.14)`)
  glow.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.restore()

  // ── Emoji（居中，稍大）──────────────────────────────────
  ctx.save()
  ctx.font = `${W * 0.44}px serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("👍", W * 0.50, H * 0.295)
  ctx.restore()

  // ── 第二层噪点（emoji 之上，增加胶片质感）───────────────────
  drawGrain(ctx, W, H, 2800)

  // ── 水平细线 ─────────────────────────────────────────────
  ctx.save()
  ctx.strokeStyle = `rgba(${tr},${tg},${tb},0.18)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W * 0.07, H * 0.568)
  ctx.lineTo(W * 0.93, H * 0.568)
  ctx.stroke()
  ctx.restore()

  // ── "D A Y" 宽字距标签 ───────────────────────────────────
  ctx.save()
  ctx.font = `600 ${W * 0.022}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.48)`
  ctx.fillText("D  A  Y", W * 0.08, H * 0.618)
  ctx.restore()

  // ── 巨型天数（左对齐，撑满左侧）─────────────────────────────
  const numFontSize = numStr.length <= 2
    ? W * 0.265
    : numStr.length === 3
      ? W * 0.215
      : W * 0.175
  ctx.save()
  ctx.font = `700 ${numFontSize}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},1.0)`
  ctx.fillText(numStr, W * 0.08, H * 0.806)
  // "天" 上标
  const numMeasure = ctx.measureText(numStr).width
  ctx.font = `300 ${numFontSize * 0.38}px ${FONT}`
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.55)`
  ctx.textBaseline = "alphabetic"
  ctx.fillText("天", W * 0.08 + numMeasure + W * 0.012, H * 0.762)
  ctx.restore()

  // ── 语录 ─────────────────────────────────────────────────
  ctx.save()
  ctx.font = `300 ${W * 0.026}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.40)`
  ctx.fillText(pickQuote(day), W * 0.08, H * 0.890)
  ctx.restore()

  // ── VIBE 品牌 ────────────────────────────────────────────
  ctx.save()
  ctx.font = `600 ${W * 0.017}px ${FONT}`
  ctx.textAlign = "right"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.20)`
  ctx.fillText("VIBE", W * 0.93, H * 0.948)
  ctx.restore()
}

// ════════════════════════════════════════════════════════════
// 自拍海报（长按拍照后）
// ════════════════════════════════════════════════════════════
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

  // 顶部遮罩
  const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.32)
  topScrim.addColorStop(0, "rgba(0,0,0,0.50)")
  topScrim.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = topScrim
  ctx.fillRect(0, 0, W, H)

  // 底部遮罩
  const botScrim = ctx.createLinearGradient(0, H * 0.58, 0, H)
  botScrim.addColorStop(0, "rgba(0,0,0,0)")
  botScrim.addColorStop(1, "rgba(0,0,0,0.60)")
  ctx.fillStyle = botScrim
  ctx.fillRect(0, 0, W, H)

  // 噪点（胶片质感）
  drawGrain(ctx, W, H, 4000)

  // 👍 印章（右下）
  ctx.save()
  ctx.font = `${W * 0.20}px serif`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.shadowColor = "rgba(0,0,0,0.45)"
  ctx.shadowBlur = 22
  ctx.fillText("👍", W * 0.92, H * 0.92)
  ctx.restore()

  // 天数文字（左上）
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.88)"
  ctx.font = `700 ${W * 0.048}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText(`已经点赞了${day}天`, W * 0.08, H * 0.072)
  ctx.restore()

  // 语录（底部居中）
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.58)"
  ctx.font = `300 ${W * 0.030}px ${FONT}`
  ctx.textAlign = "center"
  ctx.textBaseline = "bottom"
  ctx.fillText(pickQuote(day), W / 2, H * 0.940)
  ctx.restore()

  // VIBE
  ctx.save()
  ctx.font = `600 ${W * 0.017}px ${FONT}`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.fillStyle = "rgba(255,255,255,0.22)"
  ctx.fillText("VIBE", W * 0.93, H * 0.975)
  ctx.restore()
}

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
    await drawSelfiePoster(ctx, width, height, day, photo, vibeColors)
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
// 奇数天 → 色块面板风  偶数天 → 杂志封面风
// ════════════════════════════════════════════════════════════
async function drawSelfiePoster(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  photo: string,
  colors: VibeColorScheme
) {
  // 加载照片
  const img = await new Promise<HTMLImageElement>((resolve) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.src = photo
  })

  if (day % 2 !== 0) {
    drawSelfiePanelStyle(ctx, W, H, day, img, colors)
  } else {
    drawSelfieFilmStyle(ctx, W, H, day, img, colors)
  }
}

// ── 自拍 A：色块面板风（奇数天）──────────────────────────────
// 上方照片 / 下方色块 / 👍 骑在分界线上
function drawSelfiePanelStyle(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  img: HTMLImageElement,
  colors: VibeColorScheme
) {
  const SPLIT = H * 0.645          // 照片与色块分界线
  const { r: br, g: bg, b: bb } = hexToRgb(colors.bgEnd)
  const { r: tr, g: tg, b: tb } = hexToRgb(colors.text)

  // 照片全屏铺底
  const sc = Math.max(W / img.width, H / img.height)
  ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc)

  // 照片底部向色块过渡的渐变
  const fadeH = H * 0.14
  const fade = ctx.createLinearGradient(0, SPLIT - fadeH, 0, SPLIT)
  fade.addColorStop(0, "rgba(0,0,0,0)")
  fade.addColorStop(1, `rgba(${br},${bg},${bb},0.96)`)
  ctx.fillStyle = fade
  ctx.fillRect(0, SPLIT - fadeH, W, fadeH)

  // 色块面板（下方）
  const panel = ctx.createLinearGradient(0, SPLIT, W * 0.8, H)
  panel.addColorStop(0, colors.bgEnd)
  panel.addColorStop(1, colors.bg)
  ctx.fillStyle = panel
  ctx.fillRect(0, SPLIT, W, H - SPLIT)

  // 面板噪点
  drawGrain(ctx, W, H, 3500)

  // 照片顶部轻遮罩（留空间给品牌标记）
  const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.18)
  topScrim.addColorStop(0, "rgba(0,0,0,0.38)")
  topScrim.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = topScrim
  ctx.fillRect(0, 0, W, H * 0.18)

  // 👍 骑在分界线上（居中，带阴影）
  const thumbSize = W * 0.24
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.35)"
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 6
  ctx.font = `${thumbSize}px serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("👍", W * 0.50, SPLIT)
  ctx.restore()

  // ── 面板文字区 ────────────────────────────────────────────
  // "已经点赞了" 小标签
  ctx.save()
  ctx.font = `300 ${W * 0.034}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.55)`
  ctx.fillText("已经点赞了", W * 0.08, H * 0.745)
  ctx.restore()

  // 天数大字 + "天"
  const numStr = `${day}`
  const numSize = W * 0.145
  ctx.save()
  ctx.font = `700 ${numSize}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},1.0)`
  ctx.fillText(numStr, W * 0.08, H * 0.840)
  const numW = ctx.measureText(numStr).width
  ctx.font = `300 ${numSize * 0.50}px ${FONT}`
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.58)`
  ctx.fillText("天", W * 0.08 + numW + W * 0.010, H * 0.810)
  ctx.restore()

  // 语录
  ctx.save()
  ctx.font = `300 ${W * 0.026}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.42)`
  ctx.fillText(pickQuote(day), W * 0.08, H * 0.908)
  ctx.restore()

  // VIBE（照片左上）
  ctx.save()
  ctx.font = `600 ${W * 0.017}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillStyle = "rgba(255,255,255,0.52)"
  ctx.fillText("VIBE", W * 0.08, H * 0.044)
  ctx.restore()
}

// ── 自拍 B：杂志封面风（偶数天）──────────────────────────────
// 照片全出血 / 渐变覆盖 / 👍 右上浮动 / 左侧大字排版
function drawSelfieFilmStyle(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  day: number,
  img: HTMLImageElement,
  colors: VibeColorScheme
) {
  const { r: br, g: bg, b: bb } = hexToRgb(colors.bgEnd)
  const { r: tr, g: tg, b: tb } = hexToRgb(colors.text)

  // 照片全屏
  const sc = Math.max(W / img.width, H / img.height)
  ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc)

  // 底部强渐变（透明 → vibeColor 85% 不透明）
  const bot = ctx.createLinearGradient(0, H * 0.38, 0, H)
  bot.addColorStop(0, "rgba(0,0,0,0)")
  bot.addColorStop(0.45, `rgba(${br},${bg},${bb},0.55)`)
  bot.addColorStop(1, `rgba(${br},${bg},${bb},0.90)`)
  ctx.fillStyle = bot
  ctx.fillRect(0, 0, W, H)

  // 顶部轻遮罩
  const top = ctx.createLinearGradient(0, 0, 0, H * 0.22)
  top.addColorStop(0, "rgba(0,0,0,0.42)")
  top.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = top
  ctx.fillRect(0, 0, W, H * 0.22)

  // 双层噪点（胶片感）
  drawGrain(ctx, W, H, 3200)
  drawGrain(ctx, W, H, 1800)

  // 👍 右侧浮动（上方区域，带大光晕）
  const { r: ar, g: ag, b: ab } = hexToRgb(colors.accent)
  ctx.save()
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.28, 0, W * 0.72, H * 0.28, W * 0.30)
  glow.addColorStop(0, `rgba(${ar},${ag},${ab},0.36)`)
  glow.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.shadowColor = "rgba(0,0,0,0.30)"
  ctx.shadowBlur = 24
  ctx.font = `${W * 0.28}px serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("👍", W * 0.72, H * 0.28)
  ctx.restore()

  // 水平细线
  ctx.save()
  ctx.strokeStyle = `rgba(${tr},${tg},${tb},0.22)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W * 0.07, H * 0.598)
  ctx.lineTo(W * 0.65, H * 0.598)
  ctx.stroke()
  ctx.restore()

  // "已经点赞了" 标签
  ctx.save()
  ctx.font = `300 ${W * 0.032}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.58)`
  ctx.fillText("已经点赞了", W * 0.08, H * 0.648)
  ctx.restore()

  // 天数大字
  const numStr = `${day}`
  const numSize = numStr.length <= 2 ? W * 0.200 : W * 0.160
  ctx.save()
  ctx.font = `700 ${numSize}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},1.0)`
  ctx.fillText(numStr, W * 0.08, H * 0.780)
  const numW2 = ctx.measureText(numStr).width
  ctx.font = `300 ${numSize * 0.45}px ${FONT}`
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.55)`
  ctx.fillText("天", W * 0.08 + numW2 + W * 0.010, H * 0.748)
  ctx.restore()

  // 语录
  ctx.save()
  ctx.font = `300 ${W * 0.026}px ${FONT}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.42)`
  ctx.fillText(pickQuote(day), W * 0.08, H * 0.872)
  ctx.restore()

  // VIBE（右下）
  ctx.save()
  ctx.font = `600 ${W * 0.017}px ${FONT}`
  ctx.textAlign = "right"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.25)`
  ctx.fillText("VIBE", W * 0.93, H * 0.948)
  ctx.restore()
}

export const QUOTES = [
  "Good energy only.",
  "Keep glowing.",
  "温柔且坚定。",
  "Day by day.",
  "持续就是力量。",
  "Still showing up.",
  "慢慢来，比较快。",
  "Nothing stops you.",
  "每天都是新的开始。",
  "One more day.",
  "轻盈地，继续。",
  "Soft but relentless.",
  "保持节奏。",
  "You earned this.",
  "不急，但不停。",
]

export function pickQuote(day: number): string {
  return QUOTES[day % QUOTES.length]
}

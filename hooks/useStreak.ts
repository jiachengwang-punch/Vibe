import { useState, useEffect } from "react"

interface StreakData {
  day: number
  lastCheckedIn: string // ISO date string, e.g. "2026-04-17"
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const KEY = "vibe_streak"

function load(): StreakData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { day: 0, lastCheckedIn: "" }
}

function save(data: StreakData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({ day: 0, lastCheckedIn: "" })
  const [checkedInToday, setCheckedInToday] = useState(false)

  useEffect(() => {
    const data = load()
    const today = todayStr()
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

    // Break streak if last check-in was before yesterday
    if (data.lastCheckedIn && data.lastCheckedIn < yesterday) {
      const reset = { day: 0, lastCheckedIn: "" }
      save(reset)
      setStreak(reset)
    } else {
      setStreak(data)
    }

    setCheckedInToday(data.lastCheckedIn === today)
  }, [])

  const checkIn = () => {
    const today = todayStr()
    const data = load()
    if (data.lastCheckedIn === today) return // already done

    const updated: StreakData = {
      day: data.day + 1,
      lastCheckedIn: today,
    }
    save(updated)
    setStreak(updated)
    setCheckedInToday(true)
  }

  return { day: streak.day, checkedInToday, checkIn }
}

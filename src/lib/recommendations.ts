// Simple recommendation system based on user reading history

const READING_HISTORY_KEY = 'kilas_reading_history'
const MAX_HISTORY_ITEMS = 50

export interface ReadingHistoryItem {
  postId: string
  slug: string
  categorySlug?: string
  readAt: number
}

// Client-side functions
export function getReadingHistory(): ReadingHistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const history = localStorage.getItem(READING_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

export function addToReadingHistory(item: Omit<ReadingHistoryItem, 'readAt'>) {
  if (typeof window === 'undefined') return

  try {
    const history = getReadingHistory()

    // Remove duplicate if exists
    const filtered = history.filter(h => h.postId !== item.postId)

    // Add new item at the beginning
    const newHistory = [
      { ...item, readAt: Date.now() },
      ...filtered
    ].slice(0, MAX_HISTORY_ITEMS)

    localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(newHistory))
  } catch {
    // Ignore errors
  }
}

export function getReadCategories(): string[] {
  const history = getReadingHistory()
  const categories = history
    .filter(h => h.categorySlug)
    .map(h => h.categorySlug as string)

  // Count occurrences and sort by frequency
  const counts: Record<string, number> = {}
  categories.forEach(cat => {
    counts[cat] = (counts[cat] || 0) + 1
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
}

export function getReadPostIds(): string[] {
  return getReadingHistory().map(h => h.postId)
}

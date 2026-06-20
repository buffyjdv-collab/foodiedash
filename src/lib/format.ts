// Formatting helpers

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function formatCount(count: number): string {
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return String(count)
}

export function priceLevelLabel(level: number): string {
  return '₹'.repeat(level)
}

export function parseJSON<T>(str: string | null): T | null {
  if (!str) return null
  try {
    return JSON.parse(str) as T
  } catch {
    return null
  }
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function shortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

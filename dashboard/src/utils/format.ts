export function formatPrice(value: number, digits = 2): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: digits })
  if (value >= 1) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (value >= 0.1) return value.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
  if (value >= 0.01) return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  return value.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })
}

export function formatChangePct(value: number): string {
  const pct = (value * 100)
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

export function compactNumber(n: number): string {
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(n)
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts
  if (d < 1000) return 'now'
  const s = Math.floor(d / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h`
}

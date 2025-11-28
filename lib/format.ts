/**
 * Format numbers to readable format (10k, 1.5M, etc.)
 */
export function formatNumber(num: number): string {
  if (num === 0) return '0'
  if (num < 1000) return num.toString()

  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absNum >= 1_000_000_000) {
    return sign + (absNum / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  }
  if (absNum >= 1_000_000) {
    return sign + (absNum / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (absNum >= 1_000) {
    return sign + (absNum / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }

  return num.toString()
}

/**
 * Format percentage with 1 decimal place
 */
export function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`
}

/**
 * Format engagement rate professionally
 */
export function formatEngagementRate(rate: number): string {
  if (rate === 0) return '0%'
  if (rate < 0.1) return `${rate.toFixed(3)}%`
  if (rate < 1) return `${rate.toFixed(2)}%`
  return `${rate.toFixed(1)}%`
}

/**
 * Format decimal number to 2 places
 */
export function formatDecimal(num: number, decimals: number = 2): string {
  return num.toFixed(decimals)
}

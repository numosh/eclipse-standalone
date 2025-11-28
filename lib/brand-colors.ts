/**
 * Brand Color Palette System
 * Ensures consistent colors for brands across all analytics and charts
 */

// Color palette for brands (visually distinct colors)
const BRAND_COLOR_PALETTE = [
  '#3B82F6', // Blue - Primary (usually for focus brand)
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber/Orange
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
]

// Map to store brand name -> color assignments
const brandColorMap = new Map<string, string>()
let colorIndex = 0

/**
 * Get consistent color for a brand
 * @param brandName Name of the brand
 * @param isFocusBrand Whether this is the focus brand (gets first color)
 */
export function getBrandColor(brandName: string, isFocusBrand: boolean = false): string {
  // Focus brand always gets the primary blue
  if (isFocusBrand) {
    brandColorMap.set(brandName, BRAND_COLOR_PALETTE[0])
    return BRAND_COLOR_PALETTE[0]
  }

  // Check if color already assigned
  if (brandColorMap.has(brandName)) {
    return brandColorMap.get(brandName)!
  }

  // Assign next available color (skip first one reserved for focus brand)
  const availableColors = BRAND_COLOR_PALETTE.slice(1)
  const color = availableColors[colorIndex % availableColors.length]
  colorIndex++

  brandColorMap.set(brandName, color)
  return color
}

/**
 * Get colors for all brands
 * @param brands Array of brand names
 * @param focusBrandName Name of the focus brand
 */
export function getBrandColors(brands: string[], focusBrandName: string): Record<string, string> {
  const colors: Record<string, string> = {}

  brands.forEach(brandName => {
    const isFocus = brandName === focusBrandName
    colors[brandName] = getBrandColor(brandName, isFocus)
  })

  return colors
}

/**
 * Reset color assignments (useful when starting new analysis)
 */
export function resetBrandColors() {
  brandColorMap.clear()
  colorIndex = 0
}

/**
 * Get lighter version of brand color for backgrounds
 */
export function getBrandColorLight(brandName: string, isFocusBrand: boolean = false): string {
  const color = getBrandColor(brandName, isFocusBrand)
  // Add opacity to make it lighter
  return color + '20' // 20% opacity
}

/**
 * Export for use in charts
 */
export const CHART_COLORS = {
  primary: BRAND_COLOR_PALETTE[0],
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  teal: '#14B8A6',
}

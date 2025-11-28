import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function calculateEngagementRate(engagements: number, followers: number): number {
  if (followers === 0) return 0
  return (engagements / followers) * 100
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: '#E4405F',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    youtube: '#FF0000',
    facebook: '#4267B2',
    website: '#6366F1'
  }
  return colors[platform.toLowerCase()] || '#8B5CF6'
}

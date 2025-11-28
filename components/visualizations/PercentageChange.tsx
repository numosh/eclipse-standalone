'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PercentageChangeProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export const PercentageChange: React.FC<PercentageChangeProps> = ({
  value,
  size = 'md',
  showIcon = true
}) => {
  const isPositive = value > 0
  const isNeutral = value === 0

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16
  }

  const colorClass = isNeutral
    ? 'text-gray-500'
    : isPositive
    ? 'text-green-600'
    : 'text-red-600'

  const bgClass = isNeutral
    ? 'bg-gray-100'
    : isPositive
    ? 'bg-green-50'
    : 'bg-red-50'

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${bgClass} ${colorClass} ${sizeClasses[size]} font-semibold`}>
      {showIcon && <Icon size={iconSize[size]} />}
      {isPositive && '+'}
      {value.toFixed(2)}%
    </span>
  )
}

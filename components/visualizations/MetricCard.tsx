'use client'

import React from 'react'
import { PercentageChange } from './PercentageChange'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  subtitle?: string
  gradient?: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'indigo'
  icon?: React.ReactNode
}

const gradients = {
  purple: 'from-purple-50 to-purple-100 border-purple-200',
  blue: 'from-blue-50 to-blue-100 border-blue-200',
  green: 'from-green-50 to-green-100 border-green-200',
  orange: 'from-orange-50 to-orange-100 border-orange-200',
  pink: 'from-pink-50 to-pink-100 border-pink-200',
  indigo: 'from-indigo-50 to-indigo-100 border-indigo-200'
}

const textColors = {
  purple: 'text-purple-900',
  blue: 'text-blue-900',
  green: 'text-green-900',
  orange: 'text-orange-900',
  pink: 'text-pink-900',
  indigo: 'text-indigo-900'
}

const subtitleColors = {
  purple: 'text-purple-700',
  blue: 'text-blue-700',
  green: 'text-green-700',
  orange: 'text-orange-700',
  pink: 'text-pink-700',
  indigo: 'text-indigo-700'
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  subtitle,
  gradient = 'purple',
  icon
}) => {
  return (
    <div className={`bg-gradient-to-br ${gradients[gradient]} p-4 rounded-lg border shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <p className={`text-xs font-semibold uppercase ${subtitleColors[gradient]}`}>{title}</p>
        {icon && <div className={subtitleColors[gradient]}>{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <p className={`text-3xl font-bold ${textColors[gradient]}`}>{value}</p>
        {change !== undefined && <PercentageChange value={change} size="sm" />}
      </div>
      {subtitle && (
        <p className={`text-xs mt-1 ${subtitleColors[gradient]} font-medium`}>{subtitle}</p>
      )}
    </div>
  )
}

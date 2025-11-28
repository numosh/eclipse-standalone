'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatNumber } from '@/lib/format'
import { PercentageChange } from './PercentageChange'

interface ComparisonBarChartProps {
  data: any[]
  dataKey: string
  nameKey: string
  title?: string
  showComparison?: boolean
  comparisonValue?: number
  comparisonLabel?: string
  height?: number
  color?: string
}

export const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({
  data,
  dataKey,
  nameKey,
  title,
  showComparison = false,
  comparisonValue,
  comparisonLabel = 'Landscape Average',
  height = 300,
  color = '#8B5CF6'
}) => {
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(value) => formatNumber(value)}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
            width={150}
          />
          <Tooltip
            formatter={(value: any) => formatNumber(value)}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          {showComparison && comparisonValue && (
            <ReferenceLine
              x={comparisonValue}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: comparisonLabel, position: 'top', fill: '#6b7280', fontSize: 11 }}
            />
          )}
          <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

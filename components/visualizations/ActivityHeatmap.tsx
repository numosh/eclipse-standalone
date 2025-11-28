'use client'

import React from 'react'

interface HeatmapData {
  hour?: number
  day?: string
  value: number
}

interface ActivityHeatmapProps {
  data: HeatmapData[]
  type: 'hourly' | 'daily'
  title?: string
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  type,
  title
}) => {
  const maxValue = Math.max(...data.map(d => d.value))

  const getColor = (value: number) => {
    const intensity = value / maxValue
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 0.25) return 'bg-purple-200'
    if (intensity < 0.5) return 'bg-purple-400'
    if (intensity < 0.75) return 'bg-purple-600'
    return 'bg-purple-800'
  }

  const getTextColor = (value: number) => {
    const intensity = value / maxValue
    return intensity > 0.5 ? 'text-white' : 'text-gray-700'
  }

  if (type === 'hourly') {
    return (
      <div className="w-full">
        {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
        <div className="grid grid-cols-24 gap-1">
          {data.map((item, idx) => (
            <div
              key={idx}
              className={`${getColor(item.value)} ${getTextColor(item.value)} rounded p-1 text-center text-xs font-semibold`}
              title={`Hour ${item.hour}: ${item.value} posts`}
            >
              <div className="text-[10px]">{item.hour}</div>
              <div className="text-xs">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Daily heatmap
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const dayData = data.find(d => d.day === day) || { value: 0 }
          return (
            <div
              key={idx}
              className={`${getColor(dayData.value)} ${getTextColor(dayData.value)} rounded-lg p-4 text-center`}
              title={`${day}: ${dayData.value} posts`}
            >
              <div className="text-sm font-semibold mb-1">{day}</div>
              <div className="text-2xl font-bold">{dayData.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

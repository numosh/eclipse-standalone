'use client'

import React from 'react'
import { Database } from 'lucide-react'

interface DataAttributionProps {
  source: string
  className?: string
}

export const DataAttribution: React.FC<DataAttributionProps> = ({
  source,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 text-xs text-gray-500 mt-4 ${className}`}>
      <Database className="w-3 h-3" />
      <span>Data source: {source}</span>
    </div>
  )
}

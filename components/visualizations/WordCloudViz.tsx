'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import react-wordcloud (maintained version) with no SSR
const ReactWordcloud = dynamic(() => import('react-wordcloud'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading word cloud...</div>
})

interface Word {
  text: string
  value: number
}

interface WordCloudVizProps {
  words: Word[]
  title?: string
  height?: number
}

export const WordCloudViz: React.FC<WordCloudVizProps> = ({
  words,
  title,
  height = 500 // Increased default height for better word layout
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [words])

  // Filter and validate words
  const validWords = words
    .filter(w => w && w.text && w.text.trim() !== '' && w.value > 0)
    .map(w => ({
      text: w.text.replace(/^#/, ''), // Remove # symbol if present
      value: w.value
    }))

  const options = {
    rotations: 2,
    rotationAngles: [0, 45] as [number, number], // Reduced rotation angles for better fit
    fontSizes: [12, 60] as [number, number], // Reduced max font size to fit more words
    scale: 'sqrt' as const,
    spiral: 'archimedean' as const,
    padding: 5, // Increased padding to prevent overlap
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold' as const,
    enableOptimizations: true, // Enable performance optimizations
  }

  const callbacks = {
    getWordColor: (word: Word) => {
      const colors = [
        '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B',
        '#EF4444', '#EC4899', '#6366F1', '#14B8A6'
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }
  }

  if (!mounted) {
    return (
      <div className="w-full">
        {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
        <div style={{ height: `${height}px` }} className="bg-white rounded-lg p-4 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!validWords || validWords.length === 0) {
    return (
      <div className="w-full">
        {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
        <div style={{ height: `${height}px` }} className="bg-white rounded-lg p-4 flex items-center justify-center border border-dashed border-gray-300">
          <p className="text-gray-400">No hashtags available for visualization</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <div style={{ height: `${height}px`, width: '100%' }} className="bg-white rounded-lg p-4 border border-gray-200">
        <ReactWordcloud
          words={validWords}
          options={options}
          callbacks={callbacks}
        />
      </div>
    </div>
  )
}

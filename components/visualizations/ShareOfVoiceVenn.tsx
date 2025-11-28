'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VennSet {
  sets: string[]
  size: number
  label?: string
}

interface ShareOfVoiceData {
  brandName: string
  totalMentions: number
  sharePercentage: number
  platforms: { platform: string; mentions: number }[]
}

interface Props {
  totalUniverse: number
  brandShares: ShareOfVoiceData[]
  vennData: VennSet[]
  universeKeywords: string[]
}

export function ShareOfVoiceVenn({ totalUniverse, brandShares, vennData, universeKeywords }: Props) {
  // Calculate positions for circular visualization
  const brandPositions = useMemo(() => {
    const brands = brandShares.map(b => b.brandName)
    const positions: { [key: string]: { x: number; y: number; radius: number; color: string } } = {}

    const colors = [
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
    ]

    if (brands.length === 1) {
      positions[brands[0]] = { x: 250, y: 200, radius: 120, color: colors[0] }
    } else if (brands.length === 2) {
      positions[brands[0]] = { x: 200, y: 200, radius: 100, color: colors[0] }
      positions[brands[1]] = { x: 300, y: 200, radius: 100, color: colors[1] }
    } else if (brands.length === 3) {
      positions[brands[0]] = { x: 250, y: 150, radius: 90, color: colors[0] }
      positions[brands[1]] = { x: 180, y: 250, radius: 90, color: colors[1] }
      positions[brands[2]] = { x: 320, y: 250, radius: 90, color: colors[2] }
    } else {
      // 4+ brands in a circle
      const centerX = 250
      const centerY = 200
      const arrangeRadius = 120
      const circleRadius = 70

      brands.forEach((brand, index) => {
        const angle = (index / brands.length) * 2 * Math.PI - Math.PI / 2
        positions[brand] = {
          x: centerX + arrangeRadius * Math.cos(angle),
          y: centerY + arrangeRadius * Math.sin(angle),
          radius: circleRadius,
          color: colors[index % colors.length]
        }
      })
    }

    return positions
  }, [brandShares])

  // Sort brands by share percentage
  const sortedBrands = useMemo(() =>
    [...brandShares].sort((a, b) => b.sharePercentage - a.sharePercentage),
    [brandShares]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Share of Voice Analysis
          </CardTitle>
          <CardDescription>
            Universe of {totalUniverse.toLocaleString()} conversations about: {universeKeywords.slice(0, 5).join(', ')}
            {universeKeywords.length > 5 && ` +${universeKeywords.length - 5} more`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venn Diagram */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Overlap Visualization</CardTitle>
            <CardDescription>How brands compete in the conversation universe</CardDescription>
          </CardHeader>
          <CardContent>
            <svg width="500" height="400" className="mx-auto">
              {/* Draw circles for each brand */}
              {Object.entries(brandPositions).map(([brand, pos]) => {
                const brandData = brandShares.find(b => b.brandName === brand)
                return (
                  <g key={brand}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={pos.radius}
                      fill={pos.color}
                      opacity="0.3"
                      stroke={pos.color}
                      strokeWidth="2"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 10}
                      textAnchor="middle"
                      className="font-bold text-sm"
                      fill={pos.color}
                    >
                      {brand}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 10}
                      textAnchor="middle"
                      className="text-xs"
                      fill="#666"
                    >
                      {brandData?.sharePercentage.toFixed(1)}%
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 25}
                      textAnchor="middle"
                      className="text-xs"
                      fill="#999"
                    >
                      ({brandData?.totalMentions.toLocaleString()})
                    </text>
                  </g>
                )
              })}

              {/* Legend */}
              <text x="10" y="380" className="text-xs text-gray-500">
                Total Universe: {totalUniverse.toLocaleString()} conversations
              </text>
            </svg>
          </CardContent>
        </Card>

        {/* Share Rankings */}
        <Card>
          <CardHeader>
            <CardTitle>Share of Voice Rankings</CardTitle>
            <CardDescription>Brand mention distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedBrands.map((brand, index) => {
                const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'
                const color = brandPositions[brand.brandName]?.color || '#gray'

                return (
                  <div key={brand.brandName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{emoji}</span>
                        <span className="font-semibold">{brand.brandName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color }}>
                          {brand.sharePercentage.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {brand.totalMentions.toLocaleString()} mentions
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${brand.sharePercentage}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>

                    {/* Platform breakdown */}
                    <div className="flex gap-2 text-xs text-gray-600">
                      {brand.platforms.slice(0, 3).map(p => (
                        <span key={p.platform} className="px-2 py-1 bg-gray-100 rounded">
                          {p.platform}: {p.mentions}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-purple-600">
              {totalUniverse.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Total Universe Conversations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {brandShares.reduce((sum, b) => sum + b.totalMentions, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Total Brand Mentions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {sortedBrands[0]?.brandName || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Voice Leader
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-amber-600">
              {(
                (brandShares.reduce((sum, b) => sum + b.totalMentions, 0) / totalUniverse) *
                100
              ).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Brand Capture Rate
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

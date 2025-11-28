'use client'

import React from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, Users, Heart, MessageSquare } from 'lucide-react'

interface CompetitiveOverviewProps {
  brandEquity: any[]
  audienceComparison: any[]
  voiceAnalysis: any[]
  focusBrandName: string
}

export const CompetitiveOverview: React.FC<CompetitiveOverviewProps> = ({
  brandEquity,
  audienceComparison,
  voiceAnalysis,
  focusBrandName
}) => {
  // Prepare radar chart data - normalized to 0-100 scale for better comparison
  const maxValues = {
    equityScore: Math.max(...brandEquity.map(b => b.equityScore)),
    followers: Math.max(...brandEquity.map(b => b.totalFollowers)),
    engagement: Math.max(...brandEquity.map(b => b.avgEngagement)),
    velocity: Math.max(...brandEquity.map(b => b.contentVelocity)),
    voiceRatio: Math.max(...voiceAnalysis.map(v => v.metrics.voiceRatio))
  }

  const radarData = brandEquity.map(brand => {
    const voice = voiceAnalysis.find(v => v.brand === brand.brand)
    const audience = audienceComparison.find(a => a.brand === brand.brand)

    return {
      metric: brand.brand,
      'Brand Equity': Math.round((brand.equityScore / maxValues.equityScore) * 100),
      'Reach': Math.round((brand.totalFollowers / maxValues.followers) * 100),
      'Engagement': Math.round((brand.avgEngagement / maxValues.engagement) * 100),
      'Content Output': Math.round((brand.contentVelocity / maxValues.velocity) * 100),
      'Earned Media': voice ? Math.round((voice.metrics.voiceRatio / maxValues.voiceRatio) * 100) : 0,
    }
  })

  // Prepare scatter chart data (Reach vs Engagement)
  const scatterData = brandEquity.map((brand, index) => ({
    name: brand.brand,
    reach: brand.totalFollowers,
    engagement: brand.avgEngagement,
    equityScore: brand.equityScore,
    isFocus: brand.brand === focusBrandName,
    color: brand.brand === focusBrandName ? '#8B5CF6' : ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]
  }))

  // Prepare comparative metrics
  const focusBrand = brandEquity.find(b => b.brand === focusBrandName) || brandEquity[0]
  const competitors = brandEquity.filter(b => b.brand !== focusBrandName)

  const focusVoice = voiceAnalysis.find(v => v.brand === focusBrandName)
  const avgCompetitorVoiceRatio = competitors.length > 0
    ? competitors.reduce((sum, c) => {
        const v = voiceAnalysis.find(voice => voice.brand === c.brand)
        return sum + (v?.metrics.voiceRatio || 0)
      }, 0) / competitors.length
    : 0

  const marketPosition = brandEquity
    .sort((a, b) => b.equityScore - a.equityScore)
    .findIndex(b => b.brand === focusBrandName) + 1

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Position</p>
                <h3 className="text-2xl font-bold text-purple-600">#{marketPosition}</h3>
                <p className="text-xs text-gray-500">out of {brandEquity.length} brands</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reach</p>
                <h3 className="text-2xl font-bold text-blue-600">
                  {(focusBrand.totalFollowers / 1000000).toFixed(1)}M
                </h3>
                <p className="text-xs text-gray-500">followers across platforms</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <h3 className="text-2xl font-bold text-green-600">{focusBrand.avgEngagement}%</h3>
                <p className="text-xs text-gray-500">across all content</p>
              </div>
              <Heart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Voice Ratio</p>
                <h3 className="text-2xl font-bold text-orange-600">
                  {focusVoice?.metrics.voiceRatio.toFixed(1)}x
                </h3>
                <p className="text-xs text-gray-500">earn vs own voice</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Positioning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - Multi-dimensional comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Competitive Positioning</CardTitle>
            <CardDescription>5-dimensional performance comparison (normalized to 100-point scale)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={450}>
              <RadarChart data={[
                {
                  metric: 'Brand Equity',
                  ...Object.fromEntries(radarData.map(b => [b.metric, b['Brand Equity']]))
                },
                {
                  metric: 'Reach',
                  ...Object.fromEntries(radarData.map(b => [b.metric, b['Reach']]))
                },
                {
                  metric: 'Engagement',
                  ...Object.fromEntries(radarData.map(b => [b.metric, b['Engagement']]))
                },
                {
                  metric: 'Content Output',
                  ...Object.fromEntries(radarData.map(b => [b.metric, b['Content Output']]))
                },
                {
                  metric: 'Earned Media',
                  ...Object.fromEntries(radarData.map(b => [b.metric, b['Earned Media']]))
                },
              ]}>
                <PolarGrid stroke="#E5E7EB" strokeWidth={1.5} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  tickCount={6}
                />
                {brandEquity.map((brand, index) => {
                  const isFocus = brand.brand === focusBrandName
                  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

                  return (
                    <Radar
                      key={brand.brand}
                      name={brand.brand}
                      dataKey={brand.brand}
                      stroke={isFocus ? '#8B5CF6' : colors[index % colors.length]}
                      fill={isFocus ? '#8B5CF6' : colors[index % colors.length]}
                      fillOpacity={isFocus ? 0.5 : 0.2}
                      strokeWidth={isFocus ? 3 : 1.5}
                      dot={{ r: isFocus ? 5 : 3, fill: isFocus ? '#8B5CF6' : colors[index % colors.length] }}
                    />
                  )
                })}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.metric}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.stroke }}>
                              {entry.name}: {entry.value}/100
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scatter Chart - Reach vs Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Reach vs Engagement Matrix</CardTitle>
            <CardDescription>Bubble size represents Brand Equity Score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  dataKey="reach"
                  name="Total Reach"
                  label={{ value: 'Total Followers', position: 'bottom', fill: '#6B7280' }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  type="number"
                  dataKey="engagement"
                  name="Engagement"
                  label={{ value: 'Avg Engagement (%)', angle: -90, position: 'left', fill: '#6B7280' }}
                  tick={{ fill: '#6B7280' }}
                />
                <ZAxis type="number" dataKey="equityScore" range={[100, 1000]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <p className="text-sm text-gray-600">Reach: {data.reach.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Engagement: {data.engagement}%</p>
                          <p className="text-sm text-gray-600">Equity Score: {data.equityScore}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Scatter name="Brands" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={entry.isFocus ? '#6D28D9' : entry.color}
                      strokeWidth={entry.isFocus ? 3 : 1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Brand Equity Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Equity Ranking</CardTitle>
          <CardDescription>Comprehensive brand performance scores</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={brandEquity.sort((a, b) => b.equityScore - a.equityScore)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="brand" tick={{ fill: '#6B7280' }} />
              <YAxis tick={{ fill: '#6B7280' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900">{data.brand}</p>
                        <p className="text-sm text-gray-600">Equity Score: {data.equityScore}</p>
                        <p className="text-sm text-gray-600">Followers: {data.totalFollowers.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Engagement: {data.avgEngagement}%</p>
                        <p className="text-sm text-gray-600">Content Velocity: {data.contentVelocity}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="equityScore" radius={[8, 8, 0, 0]}>
                {brandEquity.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.brand === focusBrandName ? '#8B5CF6' : '#CBD5E1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle>Competitive Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-purple-600"></div>
            <p className="text-sm text-gray-700">
              <strong>{focusBrandName}</strong> ranks <strong>#{marketPosition}</strong> in overall brand equity
              with a score of <strong>{focusBrand.equityScore}</strong>
            </p>
          </div>
          {focusVoice && avgCompetitorVoiceRatio > 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-600"></div>
              <p className="text-sm text-gray-700">
                Voice ratio is <strong>{focusVoice.metrics.voiceRatio.toFixed(1)}x</strong> compared to competitor
                average of <strong>{avgCompetitorVoiceRatio.toFixed(1)}x</strong> -
                {focusVoice.metrics.voiceRatio > avgCompetitorVoiceRatio
                  ? ' performing above market average'
                  : ' opportunity to improve earned media'}
              </p>
            </div>
          )}
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-green-600"></div>
            <p className="text-sm text-gray-700">
              Total reach across all platforms: <strong>{focusBrand.totalFollowers.toLocaleString()}</strong> followers
              with <strong>{focusBrand.avgEngagement}%</strong> average engagement rate
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

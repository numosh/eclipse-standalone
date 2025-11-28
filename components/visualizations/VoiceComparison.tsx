'use client'

import React from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { formatNumber } from '@/lib/format'

interface VoiceMetrics {
  ownVoice: {
    totalPosts: number
    totalReach: number
    totalEngagement: number
    avgEngagementPerPost: number
  }
  earnVoice: {
    totalMentions: number
    totalReach: number
    totalEngagement: number
    avgEngagementPerMention: number
    sentiment: {
      positive: number
      neutral: number
      negative: number
    }
  }
  voiceRatio: number
  amplificationFactor: number
}

interface VoiceComparisonProps {
  brandName: string
  metrics: VoiceMetrics
  insights?: string
}

export const VoiceComparison: React.FC<VoiceComparisonProps> = ({
  brandName,
  metrics,
  insights
}) => {
  // Prepare data for comparison chart
  const comparisonData = [
    {
      metric: 'Volume',
      'Own Voice': metrics.ownVoice.totalPosts,
      'Earn Voice': metrics.earnVoice.totalMentions
    },
    {
      metric: 'Reach',
      'Own Voice': metrics.ownVoice.totalReach,
      'Earn Voice': metrics.earnVoice.totalReach
    },
    {
      metric: 'Engagement',
      'Own Voice': metrics.ownVoice.totalEngagement,
      'Earn Voice': metrics.earnVoice.totalEngagement
    }
  ]

  // Sentiment pie chart data
  const sentimentData = [
    { name: 'Positive', value: metrics.earnVoice.sentiment.positive, color: '#10b981' },
    { name: 'Neutral', value: metrics.earnVoice.sentiment.neutral, color: '#6b7280' },
    { name: 'Negative', value: metrics.earnVoice.sentiment.negative, color: '#ef4444' }
  ].filter(d => d.value > 0)

  const totalSentiment = metrics.earnVoice.sentiment.positive +
                        metrics.earnVoice.sentiment.neutral +
                        metrics.earnVoice.sentiment.negative

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <p className="text-xs font-semibold uppercase text-purple-700">Voice Ratio</p>
          <p className="text-3xl font-bold text-purple-900">{metrics.voiceRatio.toFixed(1)}x</p>
          <p className="text-xs text-purple-600 mt-1">Mentions per Post</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold uppercase text-blue-700">Amplification</p>
          <p className="text-3xl font-bold text-blue-900">{metrics.amplificationFactor.toFixed(1)}x</p>
          <p className="text-xs text-blue-600 mt-1">Engagement Boost</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <p className="text-xs font-semibold uppercase text-green-700">Own Posts</p>
          <p className="text-3xl font-bold text-green-900">{formatNumber(metrics.ownVoice.totalPosts)}</p>
          <p className="text-xs text-green-600 mt-1">{formatNumber(metrics.ownVoice.totalEngagement)} engagement</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <p className="text-xs font-semibold uppercase text-orange-700">Earned Mentions</p>
          <p className="text-3xl font-bold text-orange-900">{formatNumber(metrics.earnVoice.totalMentions)}</p>
          <p className="text-xs text-orange-600 mt-1">{formatNumber(metrics.earnVoice.totalEngagement)} engagement</p>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-base mb-4 text-gray-800">Own vs Earn Voice Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="metric"
              tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              tickFormatter={(value) => formatNumber(value)}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: any, name: string) => [formatNumber(value), name]}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
            <Bar dataKey="Own Voice" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Earn Voice" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment Analysis */}
      {totalSentiment > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-base mb-4 text-gray-800">Sentiment Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / totalSentiment) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [value + ' mentions', '']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-base mb-4 text-gray-800">Sentiment Breakdown</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Positive</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{metrics.earnVoice.sentiment.positive}</p>
                  <p className="text-xs text-gray-500">
                    {((metrics.earnVoice.sentiment.positive / totalSentiment) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm font-medium text-gray-700">Neutral</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{metrics.earnVoice.sentiment.neutral}</p>
                  <p className="text-xs text-gray-500">
                    {((metrics.earnVoice.sentiment.neutral / totalSentiment) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">Negative</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{metrics.earnVoice.sentiment.negative}</p>
                  <p className="text-xs text-gray-500">
                    {((metrics.earnVoice.sentiment.negative / totalSentiment) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
          <h4 className="font-semibold text-base mb-3 text-indigo-900 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Key Insights
          </h4>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{insights}</div>
        </div>
      )}
    </div>
  )
}

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target, TrendingUp, Users, Zap, BarChart3, Award } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

interface CompetitorStrategicAnalysisProps {
  brandEquity: any[]
  voiceAnalysis: any[]
  audienceComparison: any[]
  focusBrandName: string
}

interface StrategicInsight {
  category: string
  icon: React.ReactNode
  insights: {
    title: string
    metric: string
    description: string
    recommendation: string
    priority: 'high' | 'medium' | 'low'
  }[]
}

export const CompetitorStrategicAnalysis: React.FC<CompetitorStrategicAnalysisProps> = ({
  brandEquity,
  voiceAnalysis,
  audienceComparison,
  focusBrandName
}) => {
  const focusBrand = brandEquity.find(b => b.brand === focusBrandName) || brandEquity[0]
  const competitors = brandEquity.filter(b => b.brand !== focusBrandName).sort((a, b) => b.equityScore - a.equityScore)
  const topCompetitor = competitors[0]
  const focusVoice = voiceAnalysis.find(v => v.brand === focusBrandName)
  const focusAudience = audienceComparison.find(a => a.brand === focusBrandName)

  // Calculate competitive gaps
  const engagementGap = topCompetitor ? ((topCompetitor.avgEngagement - focusBrand.avgEngagement) / topCompetitor.avgEngagement) * 100 : 0
  const reachGap = topCompetitor ? ((topCompetitor.totalFollowers - focusBrand.totalFollowers) / topCompetitor.totalFollowers) * 100 : 0
  const contentVelocityGap = topCompetitor ? ((topCompetitor.contentVelocity - focusBrand.contentVelocity) / topCompetitor.contentVelocity) * 100 : 0

  // Prepare engagement comparison data
  const engagementComparison = brandEquity.map(brand => ({
    brand: brand.brand,
    engagement: brand.avgEngagement,
    isFocus: brand.brand === focusBrandName
  })).sort((a, b) => b.engagement - a.engagement)

  // Prepare content velocity comparison
  const velocityComparison = brandEquity.map(brand => ({
    brand: brand.brand,
    velocity: brand.contentVelocity,
    isFocus: brand.brand === focusBrandName
  })).sort((a, b) => b.velocity - a.velocity)

  // Prepare awareness/reach comparison
  const awarenessData = brandEquity.map(brand => {
    const voice = voiceAnalysis.find(v => v.brand === brand.brand)
    return {
      brand: brand.brand,
      'Total Reach (M)': Math.round(brand.totalFollowers / 1000000),
      'Voice Ratio': voice ? voice.metrics.voiceRatio : 0,
      'Equity Score': brand.equityScore,
      isFocus: brand.brand === focusBrandName
    }
  })

  // Strategic Insights
  const strategicInsights: StrategicInsight[] = []

  // 1. ENGAGEMENT STRATEGY
  const engagementInsights: StrategicInsight['insights'] = []

  if (engagementGap > 20) {
    engagementInsights.push({
      title: 'Engagement Rate Deficit',
      metric: `-${engagementGap.toFixed(0)}% vs ${topCompetitor?.brand}`,
      description: `${topCompetitor?.brand} achieves ${topCompetitor?.avgEngagement}% engagement vs your ${focusBrand.avgEngagement}%`,
      recommendation: 'Analyze top competitor\'s content format, posting times, and engagement tactics. Test interactive content (polls, Q&A, contests)',
      priority: 'high'
    })
  }

  // Find competitor with best engagement
  const bestEngagementCompetitor = competitors.reduce((best, c) => c.avgEngagement > best.avgEngagement ? c : best, competitors[0])
  if (bestEngagementCompetitor && bestEngagementCompetitor.avgEngagement > focusBrand.avgEngagement * 1.2) {
    engagementInsights.push({
      title: 'Best-in-Class Engagement Benchmark',
      metric: `${bestEngagementCompetitor.avgEngagement}% engagement`,
      description: `${bestEngagementCompetitor.brand} sets the benchmark with superior audience interaction`,
      recommendation: 'Study their content themes, visual style, and call-to-action strategies. Implement similar tactics adapted to your brand voice',
      priority: 'high'
    })
  }

  if (engagementInsights.length > 0) {
    strategicInsights.push({
      category: 'Engagement Strategy',
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      insights: engagementInsights
    })
  }

  // 2. AWARENESS & REACH STRATEGY
  const awarenessInsights: StrategicInsight['insights'] = []

  if (reachGap > 30) {
    awarenessInsights.push({
      title: 'Significant Reach Gap',
      metric: `-${(focusBrand.totalFollowers / 1000000).toFixed(1)}M followers`,
      description: `${topCompetitor?.brand} has ${(topCompetitor?.totalFollowers / 1000000).toFixed(1)}M followers vs your ${(focusBrand.totalFollowers / 1000000).toFixed(1)}M`,
      recommendation: 'Launch paid acquisition campaigns, partner with micro-influencers, and run cross-platform promotions',
      priority: 'high'
    })
  }

  // Voice ratio analysis
  const topVoiceCompetitor = competitors.reduce((best, c) => {
    const cVoice = voiceAnalysis.find(v => v.brand === c.brand)
    const bestVoice = voiceAnalysis.find(v => v.brand === best.brand)
    return (cVoice?.metrics.voiceRatio || 0) > (bestVoice?.metrics.voiceRatio || 0) ? c : best
  }, competitors[0])

  const topVoiceMetrics = voiceAnalysis.find(v => v.brand === topVoiceCompetitor?.brand)
  if (focusVoice && topVoiceMetrics && topVoiceMetrics.metrics.voiceRatio > focusVoice.metrics.voiceRatio * 1.5) {
    awarenessInsights.push({
      title: 'Earned Media Opportunity',
      metric: `${topVoiceMetrics.metrics.voiceRatio.toFixed(1)}x voice ratio (${topVoiceCompetitor.brand})`,
      description: `${topVoiceCompetitor.brand} generates ${topVoiceMetrics.metrics.voiceRatio.toFixed(1)}x earned mentions vs your ${focusVoice.metrics.voiceRatio.toFixed(1)}x`,
      recommendation: 'Create shareable content, launch hashtag campaigns, encourage UGC through incentives and contests',
      priority: 'medium'
    })
  }

  if (awarenessInsights.length > 0) {
    strategicInsights.push({
      category: 'Awareness & Reach',
      icon: <Users className="h-5 w-5 text-blue-600" />,
      insights: awarenessInsights
    })
  }

  // 3. CONTENT STRATEGY
  const contentInsights: StrategicInsight['insights'] = []

  if (contentVelocityGap > 25) {
    contentInsights.push({
      title: 'Content Output Gap',
      metric: `${focusBrand.contentVelocity} posts/month`,
      description: `${topCompetitor?.brand} publishes ${topCompetitor?.contentVelocity} posts/month vs your ${focusBrand.contentVelocity}`,
      recommendation: 'Increase content calendar to match competitor output. Repurpose content across platforms for efficiency',
      priority: 'medium'
    })
  }

  // Find most active competitor
  const mostActiveCompetitor = competitors.reduce((best, c) => c.contentVelocity > best.contentVelocity ? c : best, competitors[0])
  if (mostActiveCompetitor && mostActiveCompetitor.contentVelocity > focusBrand.contentVelocity * 1.3) {
    contentInsights.push({
      title: 'High-Frequency Publishing Benchmark',
      metric: `${mostActiveCompetitor.contentVelocity} posts/month (${mostActiveCompetitor.brand})`,
      description: `${mostActiveCompetitor.brand} maintains aggressive content schedule, increasing share of voice`,
      recommendation: 'Build content pipeline with batched creation, leverage user-generated content, and automate scheduling',
      priority: 'medium'
    })
  }

  if (contentInsights.length > 0) {
    strategicInsights.push({
      category: 'Content Strategy',
      icon: <BarChart3 className="h-5 w-5 text-green-600" />,
      insights: contentInsights
    })
  }

  // 4. COMPETITIVE POSITIONING
  const positioningInsights: StrategicInsight['insights'] = []

  const marketPosition = brandEquity.sort((a, b) => b.equityScore - a.equityScore).findIndex(b => b.brand === focusBrandName) + 1

  if (marketPosition > 2) {
    positioningInsights.push({
      title: 'Market Position Challenge',
      metric: `#${marketPosition} of ${brandEquity.length}`,
      description: `Currently ranked ${marketPosition} in overall brand equity - opportunity to move up`,
      recommendation: 'Focus on differentiation strategy, identify unique value propositions, and amplify competitive advantages',
      priority: marketPosition > 3 ? 'high' : 'medium'
    })
  }

  // Find brand with best equity score
  const equityLeader = brandEquity.reduce((best, b) => b.equityScore > best.equityScore ? b : best, brandEquity[0])
  if (equityLeader.brand !== focusBrandName) {
    const equityGap = ((equityLeader.equityScore - focusBrand.equityScore) / equityLeader.equityScore) * 100
    positioningInsights.push({
      title: 'Brand Equity Leadership Gap',
      metric: `${equityGap.toFixed(0)}% below ${equityLeader.brand}`,
      description: `${equityLeader.brand} leads with ${equityLeader.equityScore} equity score vs your ${focusBrand.equityScore}`,
      recommendation: 'Holistic brand building: increase reach, boost engagement, accelerate content, and drive earned media',
      priority: 'high'
    })
  }

  if (positioningInsights.length > 0) {
    strategicInsights.push({
      category: 'Competitive Positioning',
      icon: <Award className="h-5 w-5 text-purple-600" />,
      insights: positioningInsights
    })
  }

  return (
    <div className="space-y-6">
      {/* Strategic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-blue-600" />
              <span className={`text-2xl font-bold ${reachGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {reachGap > 0 ? '-' : '+'}{Math.abs(reachGap).toFixed(0)}%
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Reach Gap</h3>
            <p className="text-sm text-gray-600">vs market leader</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-8 w-8 text-yellow-600" />
              <span className={`text-2xl font-bold ${engagementGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {engagementGap > 0 ? '-' : '+'}{Math.abs(engagementGap).toFixed(0)}%
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Engagement Gap</h3>
            <p className="text-sm text-gray-600">vs market leader</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <span className={`text-2xl font-bold ${contentVelocityGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {contentVelocityGap > 0 ? '-' : '+'}{Math.abs(contentVelocityGap).toFixed(0)}%
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Content Velocity Gap</h3>
            <p className="text-sm text-gray-600">vs market leader</p>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate Comparison</CardTitle>
            <CardDescription>Performance vs competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fill: '#6B7280' }} />
                <YAxis type="category" dataKey="brand" tick={{ fill: '#6B7280', fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="engagement" radius={[0, 4, 4, 0]}>
                  {engagementComparison.map((entry, index) => (
                    <rect
                      key={`cell-${index}`}
                      fill={entry.isFocus ? '#8B5CF6' : '#CBD5E1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Awareness Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Awareness Metrics</CardTitle>
            <CardDescription>Reach, voice, and equity comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={awarenessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="brand" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: '#6B7280' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Total Reach (M)" fill="#3B82F6" />
                <Bar yAxisId="right" dataKey="Voice Ratio" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-purple-600" />
            Strategic Recommendations
          </CardTitle>
          <CardDescription>Actionable insights to close competitive gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {strategicInsights.map((category, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{category.category}</h3>
                </div>
                <div className="space-y-3">
                  {category.insights.map((insight, iIdx) => (
                    <div
                      key={iIdx}
                      className={`p-4 bg-white rounded-lg border-l-4 shadow-sm ${
                        insight.priority === 'high'
                          ? 'border-l-red-500'
                          : insight.priority === 'medium'
                          ? 'border-l-orange-500'
                          : 'border-l-green-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            insight.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : insight.priority === 'medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {insight.priority.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded">
                            {insight.metric}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                      <div className="flex items-start space-x-2 mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-blue-900 mb-1">Recommended Action:</p>
                          <p className="text-xs text-gray-700">{insight.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

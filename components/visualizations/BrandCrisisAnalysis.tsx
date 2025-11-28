'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertTriangle, Shield, TrendingDown, MessageSquare, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface BrandCrisisAnalysisProps {
  voiceAnalysis: any[]
  brandEquity: any[]
  focusBrandName: string
}

interface CrisisIndicator {
  type: 'high' | 'medium' | 'low'
  title: string
  description: string
  severity: number // 0-100
  recommendation: string
}

export const BrandCrisisAnalysis: React.FC<BrandCrisisAnalysisProps> = ({
  voiceAnalysis,
  brandEquity,
  focusBrandName
}) => {
  const focusVoice = voiceAnalysis.find(v => v.brand === focusBrandName)
  const focusBrand = brandEquity.find(b => b.brand === focusBrandName)

  const crisisIndicators: CrisisIndicator[] = []
  let overallRiskLevel: 'low' | 'medium' | 'high' = 'low'
  let riskScore = 0

  if (focusVoice && focusVoice.metrics.earnVoice.sentiment) {
    const sentiment = focusVoice.metrics.earnVoice.sentiment
    const totalSentiment = sentiment.positive + sentiment.neutral + sentiment.negative

    if (totalSentiment > 0) {
      const negativePercent = (sentiment.negative / totalSentiment) * 100
      const positivePercent = (sentiment.positive / totalSentiment) * 100

      // HIGH RISK: Negative sentiment > 30%
      if (negativePercent > 30) {
        crisisIndicators.push({
          type: 'high',
          title: 'Critical Negative Sentiment',
          description: `${negativePercent.toFixed(0)}% of brand mentions are negative - immediate action required`,
          severity: Math.min(100, negativePercent * 2),
          recommendation: 'Launch crisis response team, issue public statement, engage with critics directly'
        })
        riskScore += 40
      }
      // MEDIUM RISK: Negative sentiment 20-30%
      else if (negativePercent > 20) {
        crisisIndicators.push({
          type: 'medium',
          title: 'Elevated Negative Sentiment',
          description: `${negativePercent.toFixed(0)}% negative mentions detected - monitor closely`,
          severity: negativePercent * 2,
          recommendation: 'Increase social listening, prepare response protocols, identify root causes'
        })
        riskScore += 25
      }
      // LOW RISK: Negative sentiment 10-20%
      else if (negativePercent > 10) {
        crisisIndicators.push({
          type: 'low',
          title: 'Minor Negative Sentiment',
          description: `${negativePercent.toFixed(0)}% negative mentions - within normal range`,
          severity: negativePercent * 2,
          recommendation: 'Continue monitoring, address individual complaints, maintain positive engagement'
        })
        riskScore += 10
      }

      // POSITIVE: Very low positive sentiment (< 30%) despite low negative
      if (positivePercent < 30 && negativePercent < 20) {
        crisisIndicators.push({
          type: 'medium',
          title: 'Low Positive Sentiment',
          description: `Only ${positivePercent.toFixed(0)}% positive mentions - brand advocacy is weak`,
          severity: 50,
          recommendation: 'Launch brand advocacy campaigns, encourage customer testimonials, improve product/service quality'
        })
        riskScore += 15
      }
    }
  }

  // Check engagement drop (if we had historical data, we'd compare trends)
  // For now, compare to competitors
  const competitors = brandEquity.filter(b => b.brand !== focusBrandName)
  const avgCompetitorEngagement = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.avgEngagement, 0) / competitors.length
    : 0

  if (focusBrand && avgCompetitorEngagement > 0) {
    const engagementGap = ((avgCompetitorEngagement - focusBrand.avgEngagement) / avgCompetitorEngagement) * 100

    if (engagementGap > 40) {
      crisisIndicators.push({
        type: 'high',
        title: 'Severe Engagement Deficit',
        description: `${engagementGap.toFixed(0)}% below market average - audience losing interest`,
        severity: Math.min(100, engagementGap),
        recommendation: 'Revamp content strategy, conduct audience research, test new content formats'
      })
      riskScore += 30
    } else if (engagementGap > 25) {
      crisisIndicators.push({
        type: 'medium',
        title: 'Below-Average Engagement',
        description: `${engagementGap.toFixed(0)}% below competitors - content not resonating`,
        severity: engagementGap,
        recommendation: 'A/B test content, increase video/interactive posts, boost community engagement'
      })
      riskScore += 20
    }
  }

  // Check voice ratio (earn/own) - if < 0.5, brand awareness is very low
  if (focusVoice && focusVoice.metrics.voiceRatio < 0.5) {
    crisisIndicators.push({
      type: 'medium',
      title: 'Minimal Brand Awareness',
      description: `Voice ratio of ${focusVoice.metrics.voiceRatio.toFixed(2)}x - people not talking about your brand`,
      severity: 60,
      recommendation: 'Launch viral campaigns, partner with influencers, invest in PR and media coverage'
    })
    riskScore += 20
  }

  // Check content velocity - if very low compared to competitors
  const avgCompetitorVelocity = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.contentVelocity, 0) / competitors.length
    : 0

  if (focusBrand && avgCompetitorVelocity > 0 && focusBrand.contentVelocity < avgCompetitorVelocity * 0.4) {
    crisisIndicators.push({
      type: 'low',
      title: 'Low Content Output',
      description: `Publishing ${focusBrand.contentVelocity} posts/month vs competitor average of ${avgCompetitorVelocity.toFixed(0)}`,
      severity: 40,
      recommendation: 'Increase posting frequency, create content calendar, hire community manager'
    })
    riskScore += 10
  }

  // Determine overall risk level
  if (riskScore >= 50) {
    overallRiskLevel = 'high'
  } else if (riskScore >= 25) {
    overallRiskLevel = 'medium'
  } else {
    overallRiskLevel = 'low'
  }

  // If no risks detected, add positive indicator
  if (crisisIndicators.length === 0) {
    crisisIndicators.push({
      type: 'low',
      title: 'No Critical Issues Detected',
      description: 'Brand health metrics within acceptable range',
      severity: 0,
      recommendation: 'Continue monitoring, maintain current strategies, stay proactive'
    })
  }

  // Simulate sentiment trend data (in real app, this would be historical data)
  const sentimentTrend = [
    { period: '6 months ago', positive: 55, negative: 15, neutral: 30 },
    { period: '5 months ago', positive: 58, negative: 14, neutral: 28 },
    { period: '4 months ago', positive: 52, negative: 18, neutral: 30 },
    { period: '3 months ago', positive: 60, negative: 12, neutral: 28 },
    { period: '2 months ago', positive: 57, negative: 16, neutral: 27 },
    { period: '1 month ago', positive: 54, negative: 19, neutral: 27 },
  ]

  // Add current period
  if (focusVoice && focusVoice.metrics.earnVoice.sentiment) {
    const sentiment = focusVoice.metrics.earnVoice.sentiment
    const total = sentiment.positive + sentiment.neutral + sentiment.negative
    if (total > 0) {
      sentimentTrend.push({
        period: 'Current',
        positive: Math.round((sentiment.positive / total) * 100),
        negative: Math.round((sentiment.negative / total) * 100),
        neutral: Math.round((sentiment.neutral / total) * 100),
      })
    }
  }

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'low': return 'text-green-600 bg-green-100'
    }
  }

  const getRiskIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-6 w-6 text-red-600" />
      case 'medium': return <AlertCircle className="h-6 w-6 text-orange-600" />
      case 'low': return <Shield className="h-6 w-6 text-green-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Risk Assessment */}
      <Card className={`border-2 ${overallRiskLevel === 'high' ? 'border-red-300 bg-red-50' : overallRiskLevel === 'medium' ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRiskColor(overallRiskLevel)}`}>
                {getRiskIcon(overallRiskLevel)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {overallRiskLevel === 'high' ? 'High Risk' : overallRiskLevel === 'medium' ? 'Medium Risk' : 'Low Risk'}
                </h3>
                <p className="text-sm text-gray-600">Brand Crisis Risk Assessment</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold" style={{
                color: overallRiskLevel === 'high' ? '#DC2626' : overallRiskLevel === 'medium' ? '#EA580C' : '#16A34A'
              }}>
                {riskScore}/100
              </div>
              <p className="text-sm text-gray-600">Risk Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Trend Analysis</CardTitle>
          <CardDescription>Historical sentiment tracking (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sentimentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6B7280' }} label={{ value: 'Sentiment %', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-1">{payload[0].payload.period}</p>
                        <p className="text-sm text-green-600">Positive: {payload[0].payload.positive}%</p>
                        <p className="text-sm text-gray-600">Neutral: {payload[0].payload.neutral}%</p>
                        <p className="text-sm text-red-600">Negative: {payload[0].payload.negative}%</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <ReferenceLine y={30} stroke="#DC2626" strokeDasharray="3 3" label="Crisis Threshold" />
              <Line type="monotone" dataKey="positive" stroke="#16A34A" strokeWidth={2} name="Positive" />
              <Line type="monotone" dataKey="neutral" stroke="#6B7280" strokeWidth={2} name="Neutral" />
              <Line type="monotone" dataKey="negative" stroke="#DC2626" strokeWidth={2} name="Negative" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Crisis Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Crisis Indicators & Recommendations</CardTitle>
          <CardDescription>Active monitoring of potential brand risks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {crisisIndicators.map((indicator, index) => (
              <div
                key={index}
                className={`p-4 border-l-4 rounded-lg ${
                  indicator.type === 'high'
                    ? 'bg-red-50 border-red-500'
                    : indicator.type === 'medium'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {indicator.type === 'high' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : indicator.type === 'medium' ? (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Shield className="h-5 w-5 text-green-600" />
                    )}
                    <h4 className="font-semibold text-gray-900">{indicator.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          indicator.type === 'high'
                            ? 'bg-red-500'
                            : indicator.type === 'medium'
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${indicator.severity}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{indicator.severity}/100</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{indicator.description}</p>
                <div className="flex items-start space-x-2 mt-3 p-3 bg-white rounded border border-gray-200">
                  <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-1">Recommended Action:</p>
                    <p className="text-xs text-gray-700">{indicator.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Early Warning System */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>Crisis Prevention Guidelines</CardTitle>
          <CardDescription>Proactive measures to maintain brand health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-600"></div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">24/7 Social Listening</h5>
                <p className="text-sm text-gray-700">Monitor mentions across all platforms in real-time</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-600"></div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">Crisis Response Team</h5>
                <p className="text-sm text-gray-700">Designate team members for rapid response</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-600"></div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">Escalation Protocols</h5>
                <p className="text-sm text-gray-700">Define clear thresholds for escalation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-600"></div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">Regular Audits</h5>
                <p className="text-sm text-gray-700">Weekly review of sentiment and engagement trends</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

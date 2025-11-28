'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'

interface SWOTAnalysisProps {
  brandEquity: any[]
  voiceAnalysis: any[]
  audienceComparison: any[]
  focusBrandName: string
}

interface SWOTItem {
  title: string
  description: string
  metric?: string
}

interface SWOT {
  strengths: SWOTItem[]
  weaknesses: SWOTItem[]
  opportunities: SWOTItem[]
  threats: SWOTItem[]
}

export const SWOTAnalysis: React.FC<SWOTAnalysisProps> = ({
  brandEquity,
  voiceAnalysis,
  audienceComparison,
  focusBrandName
}) => {
  const focusBrand = brandEquity.find(b => b.brand === focusBrandName) || brandEquity[0]
  const competitors = brandEquity.filter(b => b.brand !== focusBrandName)
  const focusVoice = voiceAnalysis.find(v => v.brand === focusBrandName)
  const focusAudience = audienceComparison.find(a => a.brand === focusBrandName)

  // Calculate averages for comparison
  const avgCompetitorEquity = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.equityScore, 0) / competitors.length
    : 0

  const avgCompetitorEngagement = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.avgEngagement, 0) / competitors.length
    : 0

  const avgCompetitorVelocity = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.contentVelocity, 0) / competitors.length
    : 0

  const avgCompetitorVoiceRatio = competitors.length > 0
    ? competitors.reduce((sum, c) => {
        const v = voiceAnalysis.find(voice => voice.brand === c.brand)
        return sum + (v?.metrics.voiceRatio || 0)
      }, 0) / competitors.length
    : 0

  const topCompetitor = competitors.sort((a, b) => b.equityScore - a.equityScore)[0]
  const marketPosition = brandEquity
    .sort((a, b) => b.equityScore - a.equityScore)
    .findIndex(b => b.brand === focusBrandName) + 1

  // Generate SWOT Analysis
  const swot: SWOT = {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  }

  // STRENGTHS: Where focus brand outperforms
  if (focusBrand.avgEngagement > avgCompetitorEngagement) {
    swot.strengths.push({
      title: 'Superior Engagement Rate',
      description: `${focusBrand.avgEngagement}% engagement outperforms market average of ${avgCompetitorEngagement.toFixed(1)}%`,
      metric: `+${(focusBrand.avgEngagement - avgCompetitorEngagement).toFixed(1)}% vs avg`
    })
  }

  if (focusVoice && focusVoice.metrics.voiceRatio > avgCompetitorVoiceRatio) {
    swot.strengths.push({
      title: 'Strong Earned Media Presence',
      description: `${focusVoice.metrics.voiceRatio.toFixed(1)}x voice ratio exceeds competitor average`,
      metric: `${focusVoice.metrics.voiceRatio.toFixed(1)}x ratio`
    })
  }

  if (focusBrand.contentVelocity > avgCompetitorVelocity) {
    swot.strengths.push({
      title: 'High Content Output',
      description: `Publishing ${focusBrand.contentVelocity} posts/month vs market average of ${avgCompetitorVelocity.toFixed(0)}`,
      metric: `${focusBrand.contentVelocity} posts/mo`
    })
  }

  if (marketPosition <= 2) {
    swot.strengths.push({
      title: 'Market Leadership Position',
      description: `Ranked #${marketPosition} in overall brand equity among ${brandEquity.length} brands`,
      metric: `#${marketPosition} position`
    })
  }

  // If no strengths found, add default
  if (swot.strengths.length === 0) {
    swot.strengths.push({
      title: 'Established Market Presence',
      description: `Active across ${focusAudience?.platforms.length || 0} social platforms with consistent content`,
      metric: `${focusAudience?.platforms.length || 0} platforms`
    })
  }

  // WEAKNESSES: Where focus brand underperforms
  if (focusBrand.avgEngagement < avgCompetitorEngagement) {
    swot.weaknesses.push({
      title: 'Below-Average Engagement',
      description: `${focusBrand.avgEngagement}% engagement trails market average of ${avgCompetitorEngagement.toFixed(1)}%`,
      metric: `${(avgCompetitorEngagement - focusBrand.avgEngagement).toFixed(1)}% gap`
    })
  }

  if (focusBrand.totalFollowers < (topCompetitor?.totalFollowers || 0)) {
    const gap = ((topCompetitor.totalFollowers - focusBrand.totalFollowers) / 1000000).toFixed(1)
    swot.weaknesses.push({
      title: 'Lower Total Reach',
      description: `${gap}M followers behind market leader ${topCompetitor?.brand}`,
      metric: `-${gap}M followers`
    })
  }

  if (focusVoice && focusVoice.metrics.voiceRatio < avgCompetitorVoiceRatio) {
    swot.weaknesses.push({
      title: 'Limited Earned Media',
      description: `Voice ratio of ${focusVoice.metrics.voiceRatio.toFixed(1)}x below competitor average`,
      metric: `${focusVoice.metrics.voiceRatio.toFixed(1)}x ratio`
    })
  }

  if (focusBrand.contentVelocity < avgCompetitorVelocity) {
    swot.weaknesses.push({
      title: 'Lower Content Output',
      description: `Publishing less frequently than competitors (${focusBrand.contentVelocity} vs ${avgCompetitorVelocity.toFixed(0)} posts/month)`,
      metric: `${focusBrand.contentVelocity} posts/mo`
    })
  }

  // If no weaknesses found (rare), add placeholder
  if (swot.weaknesses.length === 0) {
    swot.weaknesses.push({
      title: 'Room for Growth',
      description: 'Continue monitoring competitive landscape for areas of improvement',
      metric: 'N/A'
    })
  }

  // OPPORTUNITIES: Market gaps and growth potential
  if (focusBrand.avgEngagement > avgCompetitorEngagement && focusBrand.totalFollowers < (topCompetitor?.totalFollowers || 0)) {
    swot.opportunities.push({
      title: 'Scale High-Performing Content',
      description: 'Strong engagement rate presents opportunity to grow reach through paid amplification',
      metric: 'High conversion potential'
    })
  }

  if (focusVoice && focusVoice.metrics.voiceRatio < 2) {
    swot.opportunities.push({
      title: 'Boost User-Generated Content',
      description: 'Launch campaigns to encourage customer testimonials, reviews, and social mentions',
      metric: 'UGC campaigns'
    })
  }

  if (focusBrand.contentVelocity < avgCompetitorVelocity) {
    swot.opportunities.push({
      title: 'Increase Content Frequency',
      description: 'Competitors publishing more frequently - opportunity to increase share of voice',
      metric: `Target: ${Math.ceil(avgCompetitorVelocity)} posts/mo`
    })
  }

  // Platform-specific opportunities
  const focusPlatforms = new Set(focusAudience?.platforms.map((p: any) => p.platform) || [])
  const competitorPlatforms = new Set(
    competitors.flatMap(c => {
      const cAud = audienceComparison.find(a => a.brand === c.brand)
      return cAud?.platforms.map((p: any) => p.platform) || []
    })
  )

  const missingPlatforms = Array.from(competitorPlatforms).filter(p => !focusPlatforms.has(p))
  if (missingPlatforms.length > 0) {
    swot.opportunities.push({
      title: 'Expand Platform Presence',
      description: `Competitors active on ${missingPlatforms.join(', ')} - untapped audience potential`,
      metric: `${missingPlatforms.length} new platforms`
    })
  }

  // Sentiment opportunity
  if (focusVoice && focusVoice.metrics.earnVoice.sentiment) {
    const totalSentiment = focusVoice.metrics.earnVoice.sentiment.positive +
                          focusVoice.metrics.earnVoice.sentiment.neutral +
                          focusVoice.metrics.earnVoice.sentiment.negative
    const positivePercent = totalSentiment > 0
      ? (focusVoice.metrics.earnVoice.sentiment.positive / totalSentiment) * 100
      : 0

    if (positivePercent < 60 && positivePercent > 30) {
      swot.opportunities.push({
        title: 'Improve Brand Sentiment',
        description: `${positivePercent.toFixed(0)}% positive sentiment - opportunity for reputation management`,
        metric: `Target: 70%+ positive`
      })
    }
  }

  // Default opportunity if none found
  if (swot.opportunities.length === 0) {
    swot.opportunities.push({
      title: 'Strategic Partnerships',
      description: 'Collaborate with influencers and brand advocates to expand reach',
      metric: 'Influencer outreach'
    })
  }

  // THREATS: Competitive risks
  if (topCompetitor && topCompetitor.equityScore > focusBrand.equityScore * 1.3) {
    swot.threats.push({
      title: 'Dominant Market Leader',
      description: `${topCompetitor.brand} has ${((topCompetitor.equityScore / focusBrand.equityScore - 1) * 100).toFixed(0)}% higher brand equity`,
      metric: `${topCompetitor.brand} leads`
    })
  }

  const fastGrowingCompetitor = competitors.find(c => c.contentVelocity > focusBrand.contentVelocity * 1.5)
  if (fastGrowingCompetitor) {
    swot.threats.push({
      title: 'Aggressive Competitor Content',
      description: `${fastGrowingCompetitor.brand} publishing ${fastGrowingCompetitor.contentVelocity} posts/month vs your ${focusBrand.contentVelocity}`,
      metric: `${fastGrowingCompetitor.contentVelocity} posts/mo`
    })
  }

  const highEngagementCompetitor = competitors.find(c => c.avgEngagement > focusBrand.avgEngagement * 1.3)
  if (highEngagementCompetitor) {
    swot.threats.push({
      title: 'Superior Competitor Engagement',
      description: `${highEngagementCompetitor.brand} achieving ${highEngagementCompetitor.avgEngagement}% engagement vs your ${focusBrand.avgEngagement}%`,
      metric: `${highEngagementCompetitor.avgEngagement}% engagement`
    })
  }

  // Sentiment threat
  if (focusVoice && focusVoice.metrics.earnVoice.sentiment) {
    const totalSentiment = focusVoice.metrics.earnVoice.sentiment.positive +
                          focusVoice.metrics.earnVoice.sentiment.neutral +
                          focusVoice.metrics.earnVoice.sentiment.negative
    const negativePercent = totalSentiment > 0
      ? (focusVoice.metrics.earnVoice.sentiment.negative / totalSentiment) * 100
      : 0

    if (negativePercent > 20) {
      swot.threats.push({
        title: 'Negative Sentiment Risk',
        description: `${negativePercent.toFixed(0)}% of mentions are negative - requires reputation management`,
        metric: `${negativePercent.toFixed(0)}% negative`
      })
    }
  }

  // Default threat if none found
  if (swot.threats.length === 0) {
    swot.threats.push({
      title: 'Market Saturation',
      description: 'Highly competitive landscape requires continuous innovation and differentiation',
      metric: `${brandEquity.length} competitors`
    })
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>SWOT Analysis: {focusBrandName}</CardTitle>
        <CardDescription>Strategic assessment of competitive position and growth opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* STRENGTHS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-700">Strengths</h3>
            </div>
            <div className="space-y-3">
              {swot.strengths.map((item, index) => (
                <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-green-900 text-sm">{item.title}</h4>
                    {item.metric && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                        {item.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-800">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WEAKNESSES */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-700">Weaknesses</h3>
            </div>
            <div className="space-y-3">
              {swot.weaknesses.map((item, index) => (
                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-red-900 text-sm">{item.title}</h4>
                    {item.metric && (
                      <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                        {item.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-red-800">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* OPPORTUNITIES */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-700">Opportunities</h3>
            </div>
            <div className="space-y-3">
              {swot.opportunities.map((item, index) => (
                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-blue-900 text-sm">{item.title}</h4>
                    {item.metric && (
                      <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        {item.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-800">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* THREATS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-orange-700">Threats</h3>
            </div>
            <div className="space-y-3">
              {swot.threats.map((item, index) => (
                <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-orange-900 text-sm">{item.title}</h4>
                    {item.metric && (
                      <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
                        {item.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-orange-800">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import { getBrandColor, getBrandColors, resetBrandColors } from '@/lib/brand-colors'

interface CommentAnalysisProps {
  session: any
  commentAnalysis: any
}

export function CommentAnalysis({ session, commentAnalysis }: CommentAnalysisProps) {
  // Reset brand colors
  React.useEffect(() => {
    resetBrandColors()
  }, [])
  if (!commentAnalysis || !commentAnalysis.commentThemes) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-semibold text-base">No conversation analysis data for this session.</p>
          <p className="text-sm mt-2">This analysis was run before conversation analysis was added.</p>
          <p className="text-sm mt-1 text-blue-600">Create a new analysis session to see conversation insights.</p>
        </CardContent>
      </Card>
    )
  }

  const brandAnalyses = JSON.parse(commentAnalysis.commentThemes)
  const focusBrand = brandAnalyses.find((b: any) => b.brandName === session.focusBrand.name)
  const competitors = brandAnalyses.filter((b: any) => b.brandName !== session.focusBrand.name)

  // Get brand colors
  const allBrands = brandAnalyses.map((b: any) => b.brandName)
  const focusBrandName = session?.focusBrand?.name || allBrands[0]
  const brandColors = getBrandColors(allBrands, focusBrandName)

  const getColorForBrand = (brandName: string) => {
    return brandColors[brandName] || '#8B5CF6'
  }

  // Overall sentiment data for pie chart (from post content analysis)
  const sentimentData = [
    { name: 'Positive', value: commentAnalysis.positiveCount, color: '#22c55e' },
    { name: 'Neutral', value: commentAnalysis.neutralCount, color: '#94a3b8' },
    { name: 'Negative', value: commentAnalysis.negativeCount, color: '#ef4444' }
  ]

  // Per-brand sentiment comparison
  const brandSentimentData = brandAnalyses.map((brand: any) => ({
    brand: brand.brandName,
    positive: brand.sentimentBreakdown?.positive || 0,
    neutral: brand.sentimentBreakdown?.neutral || 0,
    negative: brand.sentimentBreakdown?.negative || 0,
    relevance: brand.captionRelevance?.relevanceRate || 0
  }))

  // Caption relevance data
  const relevanceData = brandAnalyses.map((brand: any) => ({
    brand: brand.brandName,
    relevant: brand.captionRelevance?.relevanceRate || 0,
    irrelevant: 100 - (brand.captionRelevance?.relevanceRate || 0)
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{commentAnalysis.totalComments.toLocaleString()}</div>
              <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {commentAnalysis.avgCommentsPerPost.toFixed(1)} per brand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positive Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                {((commentAnalysis.positiveCount / commentAnalysis.totalComments) * 100).toFixed(1)}%
              </div>
              <ThumbsUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {commentAnalysis.positiveCount} posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negative Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">
                {((commentAnalysis.negativeCount / commentAnalysis.totalComments) * 100).toFixed(1)}%
              </div>
              <ThumbsDown className="w-8 h-8 text-red-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {commentAnalysis.negativeCount} posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversation Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">
                {focusBrand ? focusBrand.topThemes?.length || 0 : '0'}
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {focusBrand?.brandName} themes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {commentAnalysis.aiSummary || 'No summary available.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {commentAnalysis.aiRecommendations || 'No recommendations available.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Focus Brand Detailed Analysis */}
      {focusBrand && (
        <Card>
          <CardHeader>
            <CardTitle>{focusBrand.brandName} - Detailed Conversation Analysis</CardTitle>
            <CardDescription>
              Analysis of {focusBrand.totalPosts} posts ({focusBrand.ownPosts} own posts, {focusBrand.earnPosts} earned mentions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Sentiment Breakdown */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Sentiment Breakdown</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{focusBrand.sentimentBreakdown.positive}</div>
                    <div className="text-xs text-green-700 mt-1">Positive</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-600">{focusBrand.sentimentBreakdown.neutral}</div>
                    <div className="text-xs text-gray-700 mt-1">Neutral</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{focusBrand.sentimentBreakdown.negative}</div>
                    <div className="text-xs text-red-700 mt-1">Negative</div>
                  </div>
                </div>
              </div>

              {/* Conversation Summary */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Conversation Summary</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {focusBrand.conversationSummary || 'Analyzing conversation patterns...'}
                  </p>
                </div>
              </div>

              {/* Engagement Metrics */}
              {focusBrand.engagementMetrics && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Engagement Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{focusBrand.engagementMetrics.avgLikes?.toFixed(0) || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">Avg Likes per Post</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{focusBrand.engagementMetrics.avgComments?.toFixed(0) || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">Avg Comments per Post</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Themes */}
              {focusBrand.topThemes && focusBrand.topThemes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Top Discussion Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {focusBrand.topThemes.map((theme: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparative Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Sentiment Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Sentiment Distribution</CardTitle>
            <CardDescription>Across all {brandAnalyses.length} brands</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Brand Sentiment Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Sentiment Comparison</CardTitle>
            <CardDescription>Positive vs Negative post sentiment by brand</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandSentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brand" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" fill="#22c55e" name="Positive" />
                <Bar dataKey="neutral" fill="#94a3b8" name="Neutral" />
                <Bar dataKey="negative" fill="#ef4444" name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Post Volume by Brand */}
        <Card>
          <CardHeader>
            <CardTitle>Post Volume by Brand</CardTitle>
            <CardDescription>Total posts analyzed per brand</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandAnalyses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brandName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalPosts" name="Total Posts">
                  {brandAnalyses.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getColorForBrand(entry.brandName)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Comparison */}
      {competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Competitor Conversation Analysis</CardTitle>
            <CardDescription>How competitors perform in content strategy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitors.map((competitor: any) => (
                <div key={competitor.brandName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{competitor.brandName}</h4>
                    <Badge>{competitor.totalPosts} posts</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Positive</div>
                      <div className="font-semibold text-green-600">
                        {((competitor.sentimentBreakdown.positive / competitor.totalPosts) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Negative</div>
                      <div className="font-semibold text-red-600">
                        {((competitor.sentimentBreakdown.negative / competitor.totalPosts) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Themes</div>
                      <div className="font-semibold text-blue-600">
                        {competitor.topThemes?.length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Own/Earn</div>
                      <div className="font-semibold">
                        {competitor.ownPosts}/{competitor.earnPosts}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

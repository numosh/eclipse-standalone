'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'
import { FileText, Layers, Share2, TrendingUp, Hash, MessageSquare } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getBrandColor, getBrandColors, resetBrandColors } from '@/lib/brand-colors'

interface ContentAnalysisProps {
  analysis: any
  session: any
}

export const ContentAnalysis: React.FC<ContentAnalysisProps> = ({ analysis, session }) => {
  // Reset brand colors at the start to ensure consistent assignment
  React.useEffect(() => {
    resetBrandColors()
  }, [])

  // Get all brand names from the analysis
  const allBrands = Array.from(new Set([
    ...analysis.brandEquity?.map((b: any) => b.brand) || [],
    ...analysis.postChannelData?.map((b: any) => b.brand) || [],
  ]))

  // Get consistent colors for all brands
  const brandColors = getBrandColors(allBrands, session?.focusBrand?.name || allBrands[0])

  // Helper function to get color by brand name
  const getColorForBrand = (brandName: string) => {
    return brandColors[brandName] || '#8B5CF6'
  }

  // Guard clause - return early if data not loaded
  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Loading content analysis data...</p>
        </div>
      </div>
    )
  }

  // Safe defaults for optional fields
  const postChannelData = analysis.postChannelData || []
  const postTypeEngagement = analysis.postTypeEngagement || []
  const brandEquity = analysis.brandEquity || []
  const keywordClustering = analysis.keywordClustering || []

  // 1.A: Number of Content
  const totalContent = postChannelData.reduce((sum: number, brand: any) => {
    return sum + brand.channels.reduce((channelSum: number, c: any) => channelSum + (c.totalPosts || 0), 0)
  }, 0)

  const contentByBrand = postChannelData.map((brand: any) => ({
    brand: brand.brand,
    totalPosts: brand.channels.reduce((sum: number, c: any) => sum + (c.totalPosts || 0), 0)
  }))

  // 1.B: Content Tier Mix - Based on engagement levels
  const contentTierData = postTypeEngagement.flatMap((brand: any) => {
    return brand.postTypes.map((pt: any) => {
      let tier = 'Low'
      if (pt.avgEngagement > 100000) tier = 'Viral'
      else if (pt.avgEngagement > 50000) tier = 'High'
      else if (pt.avgEngagement > 10000) tier = 'Medium'

      return {
        brand: brand.brand,
        type: pt.type,
        tier,
        engagement: pt.avgEngagement,
        count: pt.count
      }
    })
  })

  const tierCounts = contentTierData.reduce((acc: any, content: any) => {
    acc[content.tier] = (acc[content.tier] || 0) + content.count
    return acc
  }, {})

  const contentTierMixData = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    count
  }))

  // 1.C: Content Channel Mix
  const channelMixData = postChannelData.flatMap((brand: any) =>
    brand.channels.map((c: any) => ({
      brand: brand.brand,
      platform: c.platform,
      posts: c.totalPosts || 0
    }))
  ).filter((d: any) => d.posts > 0)

  const channelTotals = channelMixData.reduce((acc: any, item: any) => {
    acc[item.platform] = (acc[item.platform] || 0) + item.posts
    return acc
  }, {})

  const channelMixChartData = Object.entries(channelTotals).map(([platform, posts]) => ({
    platform,
    posts
  }))

  // 1.D: Content Performance Contribution
  const performanceData = contentByBrand.map((brand: any) => {
    const brandEquityItem = brandEquity.find((b: any) => b.brand === brand.brand)
    const avgEngagement = brandEquityItem ? brandEquityItem.avgEngagement : 0
    const reach = brandEquityItem ? brandEquityItem.totalFollowers : 0

    return {
      brand: brand.brand,
      posts: brand.totalPosts,
      views: Math.round(reach * brand.totalPosts * 0.3), // Estimated
      engagement: Math.round(reach * (avgEngagement / 100)),
      reach: reach
    }
  })

  // 1.E: Top Keywords
  const topKeywords = keywordClustering.flatMap((brandKw: any) => {
    return (brandKw.topKeywords || []).slice(0, 10).map((kw: any) => ({
      keyword: kw.keyword,
      frequency: kw.frequency,
      brand: brandKw.brand,
      platform: brandKw.platform
    }))
  })

  // Sort by frequency and get top 20
  const sortedKeywords = topKeywords.sort((a: any, b: any) => b.frequency - a.frequency).slice(0, 20)

  // 1.F: Conversation Area - from keyword clustering themes
  const conversationAreas = keywordClustering.flatMap((brandKw: any) => {
    return (brandKw.conversationThemes || []).map((theme: string) => ({
      theme,
      brand: brandKw.brand,
      platform: brandKw.platform,
      posts: brandKw.totalPosts
    }))
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">2.0 Content Analysis</h2>
        <p className="text-gray-600 mt-2">
          In-depth analysis of content performance and conversation themes
        </p>
      </div>

      {/* 1.A: Number of Content */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            1.A Number of Content
          </CardTitle>
          <CardDescription>Total posts/content pieces analyzed across all brands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Total Content</p>
              <p className="text-4xl font-bold text-blue-600">{formatNumber(totalContent)}</p>
              <p className="text-xs text-gray-500 mt-1">posts analyzed</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Avg per Brand</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatNumber(Math.round(totalContent / contentByBrand.length))}
              </p>
              <p className="text-xs text-gray-500 mt-1">posts/brand</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {contentByBrand.map((brand: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="font-semibold text-gray-900">{brand.brand}</span>
                <span className="text-blue-600 font-bold">{formatNumber(brand.totalPosts)} posts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 1.B: Content Tier Mix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            1.B Content Tier Mix
          </CardTitle>
          <CardDescription>
            Classification based on engagement performance (Viral: &gt;100K, High: 50K-100K, Medium: 10K-50K, Low: &lt;10K)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={contentTierMixData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.tier}: ${entry.count}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
              >
                {contentTierMixData.map((entry, index) => {
                  const tierColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
                  return <Cell key={`cell-${index}`} fill={tierColors[index % tierColors.length]} />
                })}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 1.C: Content Channel Mix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            1.C Content Channel Mix
          </CardTitle>
          <CardDescription>Distribution of content across social media platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={channelMixChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="platform"
                tick={{ fill: '#374151', fontSize: 12 }}
                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                formatter={(value: any) => [`${formatNumber(value)} posts`, 'Count']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="posts" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 1.D: Content Performance Contribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            1.D Content Performance Contribution
          </CardTitle>
          <CardDescription>
            Key performance metrics: Views, Engagement, Reach, and Post Volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={performanceData.map((d: any) => ({
              ...d,
              brandColor: getColorForBrand(d.brand)
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="brand" tick={{ fill: '#374151', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(value) => formatNumber(value)} />
              <Tooltip
                formatter={(value: any) => formatNumber(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="posts" name="Post Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="views" name="Est. Views" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engagement" name="Engagement" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left">Brand</th>
                  <th className="border px-4 py-2 text-right">Posts</th>
                  <th className="border px-4 py-2 text-right">Est. Views</th>
                  <th className="border px-4 py-2 text-right">Engagement</th>
                  <th className="border px-4 py-2 text-right">Reach</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((content: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border px-4 py-2 font-semibold">{content.brand}</td>
                    <td className="border px-4 py-2 text-right">{formatNumber(content.posts)}</td>
                    <td className="border px-4 py-2 text-right">{formatNumber(content.views)}</td>
                    <td className="border px-4 py-2 text-right">{formatNumber(content.engagement)}</td>
                    <td className="border px-4 py-2 text-right">{formatNumber(content.reach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 1.E: Top Keywords */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-purple-600" />
            1.E Top Keywords
          </CardTitle>
          <CardDescription>Most frequently mentioned keywords across all content</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedKeywords.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                {sortedKeywords.slice(0, 20).map((kw: any, idx: number) => {
                  const brandColor = getColorForBrand(kw.brand)
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-4 border-2 hover:shadow-md transition-all"
                      style={{ borderColor: brandColor + '40' }}
                    >
                      <p className="font-bold text-sm truncate" style={{ color: brandColor }}>{kw.keyword}</p>
                      <p className="text-xs text-gray-600 mt-1">{kw.frequency}x mentions</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{kw.brand}</p>
                    </div>
                  )
                })}
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedKeywords.slice(0, 10).map((kw: any) => ({
                  ...kw,
                  fill: getColorForBrand(kw.brand)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="keyword"
                    tick={{ fill: '#374151', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-semibold" style={{ color: data.fill }}>{data.keyword}</p>
                            <p className="text-sm text-gray-600">{data.brand}</p>
                            <p className="text-sm">Frequency: {data.frequency}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="frequency" name="Frequency" radius={[4, 4, 0, 0]}>
                    {sortedKeywords.slice(0, 10).map((kw: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getColorForBrand(kw.brand)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-semibold">No keyword data available</p>
              <p className="text-sm text-yellow-700 mt-2">
                Keyword analysis requires text content from posts
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1.F: Conversation Area */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            1.F Conversation Area
          </CardTitle>
          <CardDescription>Main conversation themes and topics discussed</CardDescription>
        </CardHeader>
        <CardContent>
          {conversationAreas.length > 0 ? (
            <div className="space-y-4">
              {keywordClustering.map((brandKw: any, idx: number) => {
                const brandColor = getColorForBrand(brandKw.brand)
                return (
                  <div key={idx} className="bg-white rounded-lg p-6 border-2" style={{ borderColor: brandColor }}>
                    <h4 className="font-bold text-lg mb-3" style={{ color: brandColor }}>
                      {brandKw.brand} - {brandKw.platform.toUpperCase()}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(brandKw.conversationThemes || []).map((theme: string, tidx: number) => (
                        <span
                          key={tidx}
                          className="px-4 py-2 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: brandColor + '20',
                            color: brandColor,
                            border: `1px solid ${brandColor}40`
                          }}
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      {brandKw.totalPosts} posts • {(brandKw.clusters || []).length} clusters
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-semibold">No conversation data available</p>
              <p className="text-sm text-yellow-700 mt-2">
                Conversation analysis requires keyword clustering data
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, Download, FileJson, Info, LayoutGrid, Users as UsersIcon, FileText, FileType } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { getPlatformColor } from '@/lib/utils'
import { formatNumber, formatPercent, formatEngagementRate, formatDecimal } from '@/lib/format'
import {
  MetricCard,
  PercentageChange,
  DataAttribution,
  ComparisonBarChart,
  WordCloudViz,
  ActivityHeatmap,
  DemographicPieChart,
  NetworkGraph,
  SankeyDiagram,
  VoiceComparison,
  CompetitiveOverview,
  SWOTAnalysis,
  BrandCrisisAnalysis,
  CompetitorStrategicAnalysis
} from '@/components/visualizations'
import { ShareOfVoiceVenn } from '@/components/visualizations/ShareOfVoiceVenn'
import { CommentAnalysis } from '@/components/analysis/CommentAnalysis'
import { ContentAnalysis } from '@/components/analysis/ContentAnalysis'
import { theme } from '@/lib/theme'
import { TrendingUp, Users, MessageSquare, Heart } from 'lucide-react'
import { getBrandColor, getBrandColors, resetBrandColors } from '@/lib/brand-colors'

// Info Tooltip Component
const InfoTooltip = ({ title, formula }: { title: string, formula: string }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
      >
        <Info className="w-3 h-3 text-blue-600" />
      </button>
      {showTooltip && (
        <div className="absolute left-6 top-0 z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-gray-300 font-mono whitespace-pre-wrap">{formula}</div>
          <div className="absolute -left-1 top-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisResultPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [session, setSession] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [authorProfiles, setAuthorProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Reset brand colors on component mount
  React.useEffect(() => {
    resetBrandColors()
  }, [])

  useEffect(() => {
    fetchAnalysis()
    fetchAuthorProfiles()
    markAsRead()
  }, [params.id])

  const fetchAnalysis = async () => {
    try {
      const res = await fetch(`/api/sessions/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setSession(data)

        if (data.analysisResult) {
          setAnalysis({
            audienceComparison: JSON.parse(data.analysisResult.audienceComparison),
            postChannelData: JSON.parse(data.analysisResult.postChannelData),
            hashtagAnalysis: JSON.parse(data.analysisResult.hashtagAnalysis),
            postTypeEngagement: JSON.parse(data.analysisResult.postTypeEngagement),
            postTimingData: JSON.parse(data.analysisResult.postTimingData),
            brandEquityData: JSON.parse(data.analysisResult.brandEquityData),
            keywordClustering: data.analysisResult.keywordClustering ? JSON.parse(data.analysisResult.keywordClustering) : [],
            voiceAnalysis: data.analysisResult.voiceAnalysis ? JSON.parse(data.analysisResult.voiceAnalysis) : [],
            shareOfVoice: data.analysisResult.shareOfVoice ? JSON.parse(data.analysisResult.shareOfVoice) : null,
            aiInsights: data.analysisResult.aiInsights,
            aiKeywordInsights: data.analysisResult.aiKeywordInsights,
            additionalMetrics: JSON.parse(data.analysisResult.additionalMetrics)
          })
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch analysis',
          variant: 'destructive'
        })
        router.push('/dashboard')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAuthorProfiles = async () => {
    try {
      const res = await fetch(`/api/sessions/${params.id}/authors`)
      if (res.ok) {
        const data = await res.json()
        setAuthorProfiles(data.authorProfiles || [])
      }
    } catch (error) {
      console.error('Failed to fetch author profiles:', error)
    }
  }

  const markAsRead = async () => {
    try {
      await fetch(`/api/sessions/${params.id}`, {
        method: 'PATCH'
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleExportPDF = async () => {
    toast({
      title: 'Generating PDF',
      description: 'Please wait...'
    })

    try {
      const res = await fetch(`/api/export/pdf/${params.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${session.title}_analysis.pdf`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Success',
          description: 'PDF downloaded successfully'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive'
      })
    }
  }

  const handleExportPDFWithGraphics = async () => {
    toast({
      title: 'Generating PDF with Graphics',
      description: 'This may take a minute... Capturing all visualizations...'
    })

    try {
      const res = await fetch(`/api/export/pdf-screenshot/${params.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${session.title}_analysis_full.pdf`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Success',
          description: 'PDF with all graphics downloaded successfully'
        })
      } else {
        throw new Error('Failed to generate PDF')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF with graphics. Try the text-only PDF instead.',
        variant: 'destructive'
      })
    }
  }

  const handleExportDOCX = async () => {
    toast({
      title: 'Generating DOCX',
      description: 'Creating editable Word document...'
    })

    try {
      const res = await fetch(`/api/export/docx/${params.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${session.title}_analysis.docx`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Success',
          description: 'DOCX document downloaded successfully'
        })
      } else {
        throw new Error('Failed to generate DOCX')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export DOCX document',
        variant: 'destructive'
      })
    }
  }

  const handleExportRawData = async () => {
    toast({
      title: 'Exporting Data',
      description: 'Please wait...'
    })

    try {
      const res = await fetch(`/api/export/raw/${params.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${session.title}_raw_data.json`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Success',
          description: 'Raw data downloaded successfully'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export raw data',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Analysis not available</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  // Prepare audience comparison data - FIXED
  const audienceData = analysis.audienceComparison.flatMap((brand: any) =>
    brand.platforms.map((p: any) => ({
      brand: brand.brand,
      platform: p.platform,
      followers: p.followers || 0  // Ensure number
    }))
  )

  // Group by brand for visualization
  const brands = analysis.audienceComparison.map((b: any) => b.brand)
  const platforms = [...new Set(audienceData.map((d: any) => d.platform))] as string[]

  const audienceChartData = brands.map((brand: string) => {
    const brandData: any = { brand }
    platforms.forEach((platform: string) => {
      const data = audienceData.find((d: any) => d.brand === brand && d.platform === platform)
      const followers = data?.followers || 0
      brandData[platform] = followers
    })
    return brandData
  })

  // Post channel pie chart data
  const postChannelChartData = analysis.postChannelData.flatMap((brand: any) =>
    brand.channels.map((c: any) => ({
      name: `${brand.brand} - ${c.platform}`,
      value: c.totalPosts || 1,
      brand: brand.brand,
      platform: c.platform
    }))
  ).filter((d: any) => d.value > 0)

  // Get brand colors
  const allBrands = brands || []
  const focusBrandName = session?.focusBrand?.name || allBrands[0]
  const brandColors = getBrandColors(allBrands, focusBrandName)

  const getColorForBrand = (brandName: string) => {
    return brandColors[brandName] || '#8B5CF6'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-500 mt-1">
              Analysis Results • {new Date(session.completedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExportDOCX} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <FileType className="w-4 h-4 mr-2" />
            Export DOCX
          </Button>
          <Button onClick={handleExportPDFWithGraphics} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Download className="w-4 h-4 mr-2" />
            PDF with Graphics
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            PDF (Text)
          </Button>
          <Button variant="outline" onClick={handleExportRawData}>
            <FileJson className="w-4 h-4 mr-2" />
            Raw JSON
          </Button>
        </div>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="audience" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Audience Conversation
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Original Content */}
        <TabsContent value="overview" className="space-y-6 mt-6">
      {/* Executive Summary - KBE Style */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Executive Summary
          </CardTitle>
          <CardDescription>
            Key performance indicators at a glance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Brands Analyzed"
              value={analysis.additionalMetrics.totalBrandsAnalyzed}
              icon={<Users className="w-4 h-4" />}
              gradient="purple"
            />
            <MetricCard
              title="Platforms Covered"
              value={analysis.additionalMetrics.totalPlatforms}
              icon={<MessageSquare className="w-4 h-4" />}
              gradient="blue"
            />
            <MetricCard
              title="Total Engagement"
              value={formatNumber(
                analysis.brandEquityData.reduce((sum: number, b: any) =>
                  sum + (b.totalFollowers * b.avgEngagement / 100), 0
                )
              )}
              icon={<Heart className="w-4 h-4" />}
              gradient="pink"
            />
            <MetricCard
              title="Analysis Period"
              value={analysis.additionalMetrics.dataRange}
              gradient="indigo"
            />
          </div>
          <DataAttribution source="Eclipse Analytics Engine • TMS API • Playwright Scraping" />
        </CardContent>
      </Card>

      {/* Share of Voice - NEW! */}
      {analysis.shareOfVoice && (
        <ShareOfVoiceVenn
          totalUniverse={analysis.shareOfVoice.totalUniverseConversations}
          brandShares={analysis.shareOfVoice.brandShares}
          vennData={analysis.shareOfVoice.vennData}
          universeKeywords={analysis.shareOfVoice.universeKeywords}
        />
      )}

      {/* Competitive Overview - NEW! */}
      <CompetitiveOverview
        brandEquity={analysis.brandEquityData}
        audienceComparison={analysis.audienceComparison}
        voiceAnalysis={analysis.voiceAnalysis}
        focusBrandName={session.focusBrand.name}
      />

      {/* SWOT Analysis */}
      <SWOTAnalysis
        brandEquity={analysis.brandEquityData}
        voiceAnalysis={analysis.voiceAnalysis}
        audienceComparison={analysis.audienceComparison}
        focusBrandName={session.focusBrand.name}
      />

      {/* Competitor Strategic Analysis */}
      <CompetitorStrategicAnalysis
        brandEquity={analysis.brandEquityData}
        voiceAnalysis={analysis.voiceAnalysis}
        audienceComparison={analysis.audienceComparison}
        focusBrandName={session.focusBrand.name}
      />

      {/* Brand Crisis Analysis */}
      <BrandCrisisAnalysis
        voiceAnalysis={analysis.voiceAnalysis}
        brandEquity={analysis.brandEquityData}
        focusBrandName={session.focusBrand.name}
      />

      {/* Brand Equity Score - Featured */}
      <Card className="border-primary/50 shadow-lg bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Brand Equity Comparison
            <InfoTooltip
              title="Brand Equity Score Calculation"
              formula="═══════════════════════════════════════════════════
BRAND EQUITY SCORING MODEL
Based on: Aaker's Brand Equity Model (1991) &
Keller's CBBE Model (2001)
═══════════════════════════════════════════════════

📊 FORMULA BREAKDOWN:

Equity Score = (Reach Score × 40%) + (Engagement Score × 40%) + (Content Score × 20%)

Where each component is normalized to 0-100 scale:

1️⃣ REACH SCORE (40% weight)
   Formula: min((Total Followers / 500,000) × 100, 100)

   • Measures: Brand Awareness & Market Penetration
   • Theory: Larger follower base = Higher brand awareness
   • Benchmark: 500K followers = 100 points (market leader)
   • Interpretation:
     - 0-25: Emerging brand (building awareness)
     - 25-50: Growing brand (moderate awareness)
     - 50-75: Established brand (strong awareness)
     - 75-100: Market leader (dominant awareness)

2️⃣ ENGAGEMENT SCORE (40% weight)
   Formula: min(Weighted Avg Engagement Rate × 10, 100)

   • Calculation: Σ(Platform Engagement × Platform Followers) / Total Followers
   • Measures: Brand Loyalty & Relationship Quality
   • Theory: Higher engagement = Stronger customer relationships (Keller, 2001)
   • Multiplier: ×10 to scale 1-5% engagement to 10-50 points
   • Benchmark: 10% engagement rate = 100 points (exceptional)
   • Interpretation:
     - 0-10: Low loyalty (weak connection)
     - 10-30: Moderate loyalty (growing connection)
     - 30-60: Strong loyalty (engaged community)
     - 60-100: Exceptional loyalty (brand advocates)

3️⃣ CONTENT SCORE (20% weight)
   Formula: min((Content Velocity / 2) × 100, 100)

   • Measures: Brand Activity & Consistency
   • Theory: Consistent content = Top-of-mind awareness
   • Benchmark: 2 posts/day = 100 points (optimal frequency)
   • Interpretation:
     - 0-25: Inactive (< 0.5 posts/day)
     - 25-50: Moderate (0.5-1 posts/day)
     - 50-75: Active (1-1.5 posts/day)
     - 75-100: Very Active (1.5-2+ posts/day)

═══════════════════════════════════════════════════
🎯 FINAL EQUITY SCORE INTERPRETATION:
═══════════════════════════════════════════════════

Overall Score = Weighted sum of all three components

• 0-20: Weak Equity (needs major improvement)
• 20-40: Developing Equity (building foundation)
• 40-60: Moderate Equity (competitive position)
• 60-80: Strong Equity (market leader potential)
• 80-100: Exceptional Equity (dominant brand)

═══════════════════════════════════════════════════
📚 THEORETICAL FOUNDATION:
═══════════════════════════════════════════════════

1. Aaker's Brand Equity Model (1991):
   - Brand Awareness → Measured by Reach
   - Brand Loyalty → Measured by Engagement
   - Perceived Quality → Reflected in Engagement Rate

2. Keller's CBBE Model (2001):
   - Brand Salience → Content Velocity
   - Brand Resonance → Engagement Score
   - Brand Awareness → Reach Score

3. Social Media Metrics Standard (Forrester, 2016):
   - Conversation Rate → Engagement component
   - Amplification Rate → Reach component
   - Consistency → Content component

═══════════════════════════════════════════════════
💡 WHY THESE WEIGHTS?
═══════════════════════════════════════════════════

• Reach (40%): Foundation - without awareness, no equity
• Engagement (40%): Quality - engaged audience = real equity
• Content (20%): Enabler - consistency maintains equity

Total = 100% comprehensive brand equity assessment

═══════════════════════════════════════════════════
📊 EXAMPLE CALCULATION:
═══════════════════════════════════════════════════

Brand X:
• Total Followers: 250,000
• Avg Engagement: 3.5%
• Content Velocity: 1.2 posts/day

Reach Score = (250,000 / 500,000) × 100 = 50
Engagement Score = 3.5 × 10 = 35
Content Score = (1.2 / 2) × 100 = 60

Equity Score = (50 × 0.4) + (35 × 0.4) + (60 × 0.2)
             = 20 + 14 + 12
             = 46 points

Interpretation: Moderate Equity, competitive position"
            />
          </CardTitle>
          <CardDescription>
            Comprehensive brand performance metrics: reach, engagement, and content activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart - PROPER FORMAT */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-base mb-3 text-gray-800">Performance Radar</h4>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  { metric: 'Reach', ...Object.fromEntries(analysis.brandEquityData.map((b: any) => [b.brand, Math.min(100, (b.totalFollowers / 100000) * 100)])) },
                  { metric: 'Engagement', ...Object.fromEntries(analysis.brandEquityData.map((b: any) => [b.brand, Math.min(100, b.avgEngagement * 10)])) },
                  { metric: 'Content', ...Object.fromEntries(analysis.brandEquityData.map((b: any) => [b.brand, Math.min(100, b.contentVelocity * 20)])) },
                  { metric: 'Equity Score', ...Object.fromEntries(analysis.brandEquityData.map((b: any) => [b.brand, Math.min(100, b.equityScore)])) }
                ]}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  {analysis.brandEquityData.map((brand: any, idx: number) => {
                    const brandColor = getColorForBrand(brand.brand)
                    return (
                      <Radar
                        key={brand.brand}
                        name={brand.brand}
                        dataKey={brand.brand}
                        stroke={brandColor}
                        fill={brandColor}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    )
                  })}
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics Cards */}
            <div className="space-y-3">
              {analysis.brandEquityData.map((brand: any, idx: number) => {
                const brandColor = getColorForBrand(brand.brand)
                return (
                  <Card key={idx} className="border-l-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderLeftColor: brandColor }}>
                    <CardContent className="pt-4 pb-4">
                      <h3 className="font-bold text-lg mb-3" style={{ color: brandColor }}>{brand.brand}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
                        <p className="text-xs text-purple-700 font-semibold uppercase">Total Reach</p>
                        <p className="text-2xl font-bold text-purple-900">{formatNumber(brand.totalFollowers)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                        <p className="text-xs text-blue-700 font-semibold uppercase">Engagement</p>
                        <p className="text-2xl font-bold text-blue-900">{formatEngagementRate(brand.avgEngagement)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
                        <p className="text-xs text-green-700 font-semibold uppercase">Post Frequency</p>
                        <p className="text-2xl font-bold text-green-900">{brand.contentVelocity.toFixed(1)}<span className="text-sm font-normal text-green-700">/day</span></p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-lg">
                        <p className="text-xs text-indigo-700 font-semibold uppercase">Equity Score</p>
                        <p className="text-2xl font-bold text-indigo-900">{brand.equityScore.toFixed(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          </div>
          <DataAttribution source="TMS API • Scraped Data • Eclipse Analysis Engine" className="mt-4" />
        </CardContent>
      </Card>

      {/* Own & Earn Voice Analysis */}
      {analysis.voiceAnalysis && analysis.voiceAnalysis.length > 0 && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              Own & Earn Voice Analysis
              <InfoTooltip
                title="Own & Earn Voice"
                formula="Own Voice = Content created BY the brand
• Total posts from brand accounts
• Direct engagement on brand posts
• Brand-controlled messaging

Earn Voice = Content ABOUT the brand
• Mentions & tags from users
• User-generated content
• Word-of-mouth reach

Voice Ratio = Earn / Own
• Higher ratio = better brand awareness
• Shows organic amplification
• Indicates brand resonance

Amplification Factor = Earn Engagement / Own Engagement
• Measures viral effectiveness
• Shows content shareability"
              />
            </CardTitle>
            <CardDescription>
              Analisa perbandingan konten yang dibuat brand vs percakapan tentang brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {analysis.voiceAnalysis.map((voice: any, idx: number) => (
                <div key={idx}>
                  <h3 className="text-xl font-bold text-indigo-900 mb-4">{voice.brand}</h3>
                  <VoiceComparison
                    brandName={voice.brand}
                    metrics={voice.metrics}
                    insights={voice.insights}
                  />
                  {idx < analysis.voiceAnalysis.length - 1 && (
                    <hr className="mt-8 border-indigo-200" />
                  )}
                </div>
              ))}
            </div>
            <DataAttribution source="TMS API • Social Listening • Eclipse Voice Engine" className="mt-6" />
          </CardContent>
        </Card>
      )}

      {/* Audience Comparison */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            1. Audience Comparison by Platform
            <InfoTooltip
              title="Audience Size Calculation"
              formula="Total Followers = Sum of followers across all platforms

Platforms tracked:
• Instagram, TikTok, Twitter/X
• YouTube, Facebook, Website

Note: Numbers are formatted (1K = 1,000, 1M = 1,000,000)"
            />
          </CardTitle>
          <CardDescription>
            Total follower count across different social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={audienceChartData} barGap={8} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="brand"
                  tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis
                  tickFormatter={(value) => formatNumber(value)}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  label={{ value: 'Followers', angle: -90, position: 'insideLeft', style: { fill: '#374151', fontWeight: 600 } }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [formatNumber(value) + ' followers', name.charAt(0).toUpperCase() + name.slice(1)]}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: '8px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingTop: '16px' }}
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                {platforms.map((platform, idx) => (
                  <Bar
                    key={platform}
                    dataKey={platform}
                    fill={getPlatformColor(platform)}
                    name={platform}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DataAttribution source="RIVAL IQ • TMS API" className="mt-4" />
        </CardContent>
      </Card>

      {/* Post Channel Distribution */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            2. Post Channel Distribution
            <InfoTooltip
              title="Post Distribution Metrics"
              formula="Avg Posts Per Day = Total Posts / Number of Days

Total Posts = All posts collected per platform
Post Distribution = Percentage of posts per channel

Shows which platforms brands prioritize for content publishing"
            />
          </CardTitle>
          <CardDescription>
            Distribution of posts across different platforms by brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={postChannelChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={(entry) => `${entry.brand}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {postChannelChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getColorForBrand(entry.brand)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value} posts`, '']}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Average Posts Per Day:</h4>
              {analysis.postChannelData.map((brand: any, bidx: number) => (
                <div key={bidx} className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold text-sm text-gray-900">{brand.brand}</p>
                  <div className="pl-2 space-y-1.5">
                    {brand.channels.map((channel: any, cidx: number) => (
                      <div key={cidx} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPlatformColor(channel.platform) }}></span>
                          {channel.platform}:
                        </span>
                        <span className="font-semibold text-gray-900">{channel.avgPostPerDay.toFixed(2)} <span className="text-xs font-normal text-gray-500">posts/day</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DataAttribution source="TMS API • Eclipse Analytics" className="mt-4" />
        </CardContent>
      </Card>

      {/* Hashtag Analysis - Enhanced with Word Cloud */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            3. Top Hashtags Used (Last 30 Days)
            <InfoTooltip
              title="Hashtag Analysis"
              formula="Top Hashtags = Most frequently used hashtags per brand

Analysis based on:
• Last 30 days of posts
• Frequency of hashtag usage
• Top 15 hashtags per brand

Shows brand messaging themes and campaign keywords"
            />
          </CardTitle>
          <CardDescription>
            Most frequently used hashtags by each brand with visual representation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Word Cloud Visualization - FIXED */}
          <div className="mb-8">
            <h4 className="font-semibold text-base mb-3 text-gray-800">Hashtag Word Cloud - All Brands</h4>
            {(() => {
              const allHashtags = analysis.hashtagAnalysis.flatMap((brand: any) =>
                (brand.topHashtags || []).map((tag: string, idx: number) => ({
                  text: tag,
                  value: (brand.topHashtags.length - idx) * 10
                }))
              ).filter((w: any) => w.text && w.text.trim() !== '')

              if (allHashtags.length === 0) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-semibold">⚠️ No hashtags found in the analysis data</p>
                    <p className="text-sm text-yellow-700 mt-2">Posts may not contain hashtags or data collection needs verification</p>
                  </div>
                )
              }

              return <WordCloudViz words={allHashtags} height={350} />
            })()}
          </div>

          {/* Hashtag Tags by Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysis.hashtagAnalysis.map((brand: any, idx: number) => (
              <div key={idx} className="space-y-3 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                <h4 className="font-bold text-lg text-purple-900">{brand.brand}</h4>
                <div className="flex flex-wrap gap-2">
                  {brand.topHashtags.length > 0 ? (
                    brand.topHashtags.map((tag: string, tidx: number) => (
                      <span
                        key={tidx}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm italic">No hashtags found</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DataAttribution source="TMS API • Eclipse Text Analysis" className="mt-6" />
        </CardContent>
      </Card>

      {/* Post Type & Engagement */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            4. Post Type & Engagement Rate
            <InfoTooltip
              title="Post Type Performance"
              formula="Avg Engagement = Total Engagement / Number of Posts

Content Types:
• Text: Text-only posts
• Image: Single image posts
• Video: Video content
• Carousel: Multiple images/videos

Identifies which content format performs best"
            />
          </CardTitle>
          <CardDescription>
            Performance analysis by content type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analysis.postTypeEngagement.map((brand: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-3 text-blue-900">{brand.brand}</h4>
                {brand.postTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={brand.postTypes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                      <XAxis dataKey="type" tick={{ fill: '#1e3a8a', fontSize: 12, fontWeight: 500 }} />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{ fill: '#3b82f6', fontSize: 11 }} label={{ value: 'Post Count', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fill: '#10b981', fontSize: 11 }} label={{ value: 'Avg Engagement', angle: 90, position: 'insideRight', fill: '#10b981' }} tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip
                        formatter={(value: any, name: string) => [name === 'Post Count' ? value : formatNumber(value), name]}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-semibold text-gray-900 mb-2">{data.type}</p>
                                <p className="text-sm text-blue-600">Post Count: {data.count}</p>
                                <p className="text-sm text-green-600">Avg Engagement: {formatNumber(data.avgEngagement)}</p>
                                {data.platforms && (
                                  <p className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-200">
                                    Platforms: {data.platforms}
                                  </p>
                                )}
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                      <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Post Count" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="avgEngagement" fill="#10b981" name="Avg Engagement" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm italic">No post type data available</p>
                )}
              </div>
            ))}
          </div>
          <DataAttribution source="TMS API • Post Metadata Analysis" className="mt-4" />
        </CardContent>
      </Card>

      {/* Post Timing Analysis */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            5. Optimal Post Timing
            <InfoTooltip
              title="Post Timing Analysis"
              formula="Post Distribution by Hour = Count of posts per hour (0-23)

Analysis shows:
• When brands publish content
• Peak posting hours
• Platform-specific patterns
• 24-hour format (0 = midnight, 12 = noon)

Helps identify optimal posting schedules"
            />
          </CardTitle>
          <CardDescription>
            When brands are posting content (24-hour format)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analysis.postTimingData.focusBrand && (
              <div>
                <h4 className="font-bold text-lg mb-4 text-gray-900">
                  Focus Brand: {analysis.postTimingData.focusBrand.brandName}
                </h4>
                {Object.entries(analysis.postTimingData.focusBrand.platforms).map(([platform, data]: [string, any]) => (
                  <div key={platform} className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-bold capitalize mb-3 text-indigo-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getPlatformColor(platform) }}></span>
                      {platform}
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={data.postTimes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="hour"
                          label={{ value: 'Hour of Day (24h)', position: 'insideBottom', offset: -5, fill: '#4c1d95' }}
                          tick={{ fill: '#4c1d95', fontSize: 11 }}
                        />
                        <YAxis
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          label={{ value: 'Number of Posts', angle: -90, position: 'insideLeft', fill: '#4c1d95' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          formatter={(value: any) => [value + ' posts', 'Count']}
                        />
                        <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} name="Posts" dot={{ fill: '#8B5CF6', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DataAttribution source="RIVAL IQ • TMS API" className="mt-4" />
        </CardContent>
      </Card>

      {/* Keyword Clustering Analysis */}
      {analysis.keywordClustering && analysis.keywordClustering.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🔤</span>
              Keyword Clustering & Conversation Analysis
              <InfoTooltip
                title="Keyword Clustering Analysis"
                formula="TF-IDF Algorithm: Identifies important keywords based on Term Frequency-Inverse Document Frequency

Process:
• Analyzes 30-40 most recent posts per platform
• Removes stopwords (Indonesian & English)
• Calculates keyword importance using TF-IDF
• Groups posts into conversation clusters
• Identifies engagement patterns per theme

Clusters show main conversation topics and their performance"
              />
            </CardTitle>
            <CardDescription>
              Analisa percakapan berdasarkan pengelompokan keyword dari 30-40 posting terakhir per channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {analysis.keywordClustering.map((brandAnalysis: any, idx: number) => (
                <div key={idx} className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {brandAnalysis.brand} - {brandAnalysis.platform.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {brandAnalysis.totalPosts} posts analyzed • {brandAnalysis.conversationThemes.length} conversation themes identified
                  </p>

                  {/* Top Keywords */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-base mb-3 text-green-900">Top Keywords by Frequency</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {brandAnalysis.topKeywords.map((kw: any, kidx: number) => (
                        <div key={kidx} className="bg-white rounded-lg p-3 shadow-sm border border-green-200 hover:border-green-400 hover:shadow-md transition-all">
                          <p className="font-bold text-green-700 text-sm truncate">{kw.keyword}</p>
                          <p className="text-xs text-gray-600 font-medium">{kw.frequency}x mentions</p>
                          <p className="text-xs text-gray-600">~{formatNumber(Math.round(kw.avgEngagement))} engagement</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keyword Clusters */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-base mb-3 text-green-900">Keyword Clusters (Conversation Groups)</h4>
                    <div className="space-y-4">
                      {brandAnalysis.clusters.map((cluster: any, cidx: number) => (
                        <div key={cidx} className="bg-white rounded-lg p-4 shadow-md border border-green-200 hover:border-green-400 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-bold text-base text-green-800">
                                Cluster #{cidx + 1}: "{cluster.topKeyword}"
                              </h5>
                              <p className="text-sm text-gray-700 italic mt-1">{cluster.theme}</p>
                            </div>
                            <div className="text-right bg-green-50 px-3 py-2 rounded-lg">
                              <p className="text-sm font-bold text-green-700">{cluster.postCount} posts</p>
                              <p className="text-xs text-gray-600">~{formatNumber(Math.round(cluster.averageEngagement))} avg engagement</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {cluster.keywords.map((keyword: string, kidx: number) => (
                              <span
                                key={kidx}
                                className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-semibold hover:from-green-200 hover:to-emerald-200 transition-colors"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>

                          {/* Sample Posts */}
                          {cluster.posts.slice(0, 2).length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-bold text-gray-700">Sample Posts:</p>
                              {cluster.posts.slice(0, 2).map((post: any, pidx: number) => (
                                <div key={pidx} className="bg-gradient-to-r from-gray-50 to-green-50 p-3 rounded-lg text-xs text-gray-700 border-l-4 border-green-400">
                                  <p className="italic">"{post.text.substring(0, 150)}{post.text.length > 150 ? '...' : ''}"</p>
                                  <p className="text-gray-600 mt-2 font-semibold">({formatNumber(post.engagement)} engagement)</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conversation Themes Summary */}
                  <div className="bg-green-100 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Conversation Themes Identified:</h4>
                    <div className="flex flex-wrap gap-2">
                      {brandAnalysis.conversationThemes.map((theme: string, tidx: number) => (
                        <span
                          key={tidx}
                          className="px-3 py-1 bg-green-200 text-green-900 rounded-md text-sm font-medium"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DataAttribution source="Eclipse Text Analysis • TF-IDF Algorithm" className="mt-4" />
          </CardContent>
        </Card>
      )}

      {/* AI Keyword Insights */}
      {analysis.aiKeywordInsights && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              AI Insights: Keyword & Conversation Analysis
              <InfoTooltip
                title="AI Keyword Insights"
                formula="Generated using AI model: glm4:latest

Analyzes:
• Top conversation topics per brand
• Engagement patterns by theme
• Content strategy effectiveness
• Recommendations for improvement

Note: If AI service is unavailable, an error message will be displayed instead of insights."
              />
            </CardTitle>
            <CardDescription>
              Strategic insights dari analisa keyword clustering dan tema percakapan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`prose prose-sm max-w-none ${analysis.aiKeywordInsights.includes('failed') || analysis.aiKeywordInsights.includes('timed out') ? 'bg-yellow-50 border border-yellow-200 p-4 rounded-lg' : ''}`}>
              {analysis.aiKeywordInsights.includes('failed') || analysis.aiKeywordInsights.includes('timed out') ? (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-900 mb-2">AI Insights Generation Issue</p>
                    <p className="text-yellow-800 leading-relaxed">{analysis.aiKeywordInsights}</p>
                    <p className="text-sm text-yellow-700 mt-3">Please check your OLLAMA_API_URL configuration in .env file or try running the analysis again when the AI service is available.</p>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                  <div className="space-y-4 text-sm md:text-base" style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.8' }}>
                    {analysis.aiKeywordInsights.split('\n').map((line: string, idx: number) => {
                      // Section headers with emoji
                      if (line.trim().startsWith('📌')) {
                        return (
                          <h3 key={idx} className="text-lg font-bold text-purple-900 mt-6 mb-2 first:mt-0">
                            {line.trim()}
                          </h3>
                        )
                      }
                      // Bullet points or action items
                      else if (line.trim().match(/^[✅✓•\-\d]+[\.\)]\s+/)) {
                        return (
                          <p key={idx} className="ml-4 text-gray-700 flex items-start gap-2">
                            <span className="text-purple-500 font-bold flex-shrink-0">•</span>
                            <span>{line.trim().replace(/^[✅✓•\-\d]+[\.\)]\s+/, '')}</span>
                          </p>
                        )
                      }
                      // Regular paragraphs
                      else if (line.trim() !== '') {
                        return <p key={idx} className="text-gray-700">{line.trim()}</p>
                      }
                      return null
                    })}
                  </div>
                </div>
              )}
            </div>
            <DataAttribution source="Ollama AI • glm4:latest Model" className="mt-4" />
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {analysis.aiInsights && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI-Generated Strategic Insights
              <InfoTooltip
                title="AI Strategic Insights"
                formula="Generated using AI model: glm4:latest

Provides:
• Brand performance comparison
• Strengths & weaknesses analysis
• Engagement & audience trends
• Strategic recommendations for focus brand
• Competitive opportunities & threats

Output in professional Indonesian language with actionable insights."
              />
            </CardTitle>
            <CardDescription>
              Professional analysis and recommendations powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`prose prose-sm max-w-none ${analysis.aiInsights.includes('failed') || analysis.aiInsights.includes('timed out') ? 'bg-yellow-50 border border-yellow-200 p-4 rounded-lg' : ''}`}>
              {analysis.aiInsights.includes('failed') || analysis.aiInsights.includes('timed out') ? (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-900 mb-2">AI Insights Generation Issue</p>
                    <p className="text-yellow-800 leading-relaxed">{analysis.aiInsights}</p>
                    <p className="text-sm text-yellow-700 mt-3">Please check your OLLAMA_API_URL configuration in .env file or try running the analysis again when the AI service is available.</p>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                  <div className="space-y-4 text-sm md:text-base" style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.8' }}>
                    {analysis.aiInsights.split('\n').map((line: string, idx: number) => {
                      // Section headers with emoji
                      if (line.trim().startsWith('📌')) {
                        return (
                          <h3 key={idx} className="text-lg font-bold text-blue-900 mt-6 mb-2 first:mt-0">
                            {line.trim()}
                          </h3>
                        )
                      }
                      // Bullet points or action items
                      else if (line.trim().match(/^[✅✓•\-\d]+[\.\)]\s+/)) {
                        return (
                          <p key={idx} className="ml-4 text-gray-700 flex items-start gap-2">
                            <span className="text-blue-500 font-bold flex-shrink-0">•</span>
                            <span>{line.trim().replace(/^[✅✓•\-\d]+[\.\)]\s+/, '')}</span>
                          </p>
                        )
                      }
                      // Regular paragraphs
                      else if (line.trim() !== '') {
                        return <p key={idx} className="text-gray-700">{line.trim()}</p>
                      }
                      return null
                    })}
                  </div>
                </div>
              )}
            </div>
            <DataAttribution source="Ollama AI • glm4:latest Model" className="mt-4" />
          </CardContent>
        </Card>
      )}

      {/* Analysis Metadata */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Analysis Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Brands Analyzed</p>
              <p className="font-semibold">{analysis.additionalMetrics.totalBrandsAnalyzed}</p>
            </div>
            <div>
              <p className="text-gray-600">Platforms Covered</p>
              <p className="font-semibold">{analysis.additionalMetrics.totalPlatforms}</p>
            </div>
            <div>
              <p className="text-gray-600">Data Range</p>
              <p className="font-semibold">{analysis.additionalMetrics.dataRange}</p>
            </div>
            <div>
              <p className="text-gray-600">Analysis Date</p>
              <p className="font-semibold">
                {new Date(analysis.additionalMetrics.analysisDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Audience Conversation Tab */}
        <TabsContent value="audience" className="mt-6">
          {analysis && session && session.commentAnalysis && (
            <CommentAnalysis session={session} commentAnalysis={session.commentAnalysis} />
          )}
        </TabsContent>

        {/* Content Analysis Tab */}
        <TabsContent value="content" className="mt-6">
          {analysis && session && (
            <ContentAnalysis analysis={analysis} session={session} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

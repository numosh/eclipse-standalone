'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Users, FileText, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface BenchmarkData {
  totalInfluencers: number
  totalContent: number
  totalClients: number
  totalCampaigns: number
  avgImpression: number
  avgReach: number
  avgEngagement: number
  avgViews: number
  irRate: number
  rrRate: number
  erRate: number
  vrRate: number
  cpi: number
  cpr: number
  cpe: number
  cpv: number
}

export default function BuznesPage() {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedSow, setSelectedSow] = useState<string>('all')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchBenchmarkData()
  }, [selectedYear, selectedMonth, selectedBrand, selectedCampaign, selectedPlatform, selectedSow, selectedTier, selectedCategory])

  const fetchBenchmarkData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear !== 'all') params.append('year', selectedYear)
      if (selectedMonth !== 'all') params.append('month', selectedMonth)
      if (selectedBrand !== 'all') params.append('brandName', selectedBrand)
      if (selectedCampaign !== 'all') params.append('campaignName', selectedCampaign)
      if (selectedPlatform !== 'all') params.append('platform', selectedPlatform)
      if (selectedSow !== 'all') params.append('sow', selectedSow)
      if (selectedTier !== 'all') params.append('tier', selectedTier)
      if (selectedCategory !== 'all') params.append('kolCategory', selectedCategory)

      const res = await fetch(`/api/buznes/benchmark?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBenchmarkData(data)
      }
    } catch (error) {
      console.error('Error fetching benchmark data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toFixed(0)
  }

  const formatCurrency = (num: number) => {
    return 'Rp' + num.toFixed(0)
  }

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(2) + '%'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            BUZZNESIA - INFLUENCER BENCHMARK DASHBOARD
          </h1>
          <p className="text-gray-600 mt-1">
            KOL Performance Benchmark & Reporting Tool
          </p>
        </div>
        <Link href="/dashboard/buznes/vetting">
          <Button>
            <Users className="w-4 h-4 mr-2" />
            KOL Vetting
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">SoW</label>
              <Select value={selectedSow} onValueChange={setSelectedSow}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SoW" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SoW</SelectItem>
                  <SelectItem value="IG Reels">IG Reels</SelectItem>
                  <SelectItem value="IG Story">IG Story</SelectItem>
                  <SelectItem value="IG Photo">IG Photo</SelectItem>
                  <SelectItem value="TT Video">TT Video</SelectItem>
                  <SelectItem value="YT Video">YT Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tier</label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="Nano">Nano (&lt;10K)</SelectItem>
                  <SelectItem value="Micro">Micro (10K-100K)</SelectItem>
                  <SelectItem value="Macro">Macro (100K-1M)</SelectItem>
                  <SelectItem value="Mega">Mega (&gt;1M)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">KOL Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Beauty & Lifestyle">Beauty & Lifestyle</SelectItem>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Gaming">Gaming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">of Influencer</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : formatNumber(benchmarkData?.totalInfluencers || 0)}
                </p>
              </div>
              <Users className="w-12 h-12 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">of Content</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : formatNumber(benchmarkData?.totalContent || 0)}
                </p>
              </div>
              <FileText className="w-12 h-12 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">No. of Clients</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : benchmarkData?.totalClients || 0}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">No. of Campaigns</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : benchmarkData?.totalCampaigns || 0}
                </p>
              </div>
              <DollarSign className="w-12 h-12 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-purple-200">
          <CardContent className="p-6">
            <p className="text-gray-600 text-sm mb-1">Impression</p>
            <p className="text-3xl font-bold text-purple-600">
              {loading ? '...' : formatNumber(benchmarkData?.avgImpression || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-pink-200">
          <CardContent className="p-6">
            <p className="text-gray-600 text-sm mb-1">Reach</p>
            <p className="text-3xl font-bold text-pink-600">
              {loading ? '...' : formatNumber(benchmarkData?.avgReach || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-blue-200">
          <CardContent className="p-6">
            <p className="text-gray-600 text-sm mb-1">Engagement</p>
            <p className="text-3xl font-bold text-blue-600">
              {loading ? '...' : formatNumber(benchmarkData?.avgEngagement || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-indigo-200">
          <CardContent className="p-6">
            <p className="text-gray-600 text-sm mb-1">Views</p>
            <p className="text-3xl font-bold text-indigo-600">
              {loading ? '...' : formatNumber(benchmarkData?.avgViews || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Performance</CardTitle>
          <CardDescription>Average performance rates across selected filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">IR%</p>
              <p className="text-3xl font-bold text-purple-600">
                {loading ? '...' : formatPercentage(benchmarkData?.irRate || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">RR%</p>
              <p className="text-3xl font-bold text-pink-600">
                {loading ? '...' : formatPercentage(benchmarkData?.rrRate || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">ER%</p>
              <p className="text-3xl font-bold text-blue-600">
                {loading ? '...' : formatPercentage(benchmarkData?.erRate || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">VR%</p>
              <p className="text-3xl font-bold text-indigo-600">
                {loading ? '...' : formatPercentage(benchmarkData?.vrRate || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Performance</CardTitle>
          <CardDescription>Average cost per performance metric</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">CPI</p>
              <p className="text-3xl font-bold text-green-600">
                {loading ? '...' : formatCurrency(benchmarkData?.cpi || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">CPR</p>
              <p className="text-3xl font-bold text-emerald-600">
                {loading ? '...' : formatCurrency(benchmarkData?.cpr || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">CPE</p>
              <p className="text-3xl font-bold text-teal-600">
                {loading ? '...' : formatCurrency(benchmarkData?.cpe || 0)}
              </p>
            </div>

            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">CPV</p>
              <p className="text-3xl font-bold text-cyan-600">
                {loading ? '...' : formatCurrency(benchmarkData?.cpv || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

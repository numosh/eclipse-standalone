'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InfluencerData {
  id: string
  socmedHandle: string
  platform: string
  tier: string
  followers: number
  kolCategory: string | null
  totalContent: number
  avgReach: number
  avgViews: number
  avgEngagement: number
  erRate: number
}

export default function VettingPage() {
  const [influencers, setInfluencers] = useState<InfluencerData[]>([])
  const [filteredInfluencers, setFilteredInfluencers] = useState<InfluencerData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [minER, setMinER] = useState<string>('')

  useEffect(() => {
    fetchInfluencers()
  }, [selectedPlatform, selectedTier, selectedCategory])

  useEffect(() => {
    filterInfluencers()
  }, [influencers, searchQuery, minER])

  const fetchInfluencers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPlatform !== 'all') params.append('platform', selectedPlatform)
      if (selectedTier !== 'all') params.append('tier', selectedTier)
      if (selectedCategory !== 'all') params.append('kolCategory', selectedCategory)

      const res = await fetch(`/api/buznes/influencers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setInfluencers(data)
      }
    } catch (error) {
      console.error('Error fetching influencers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInfluencers = () => {
    let filtered = influencers

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(inf =>
        inf.socmedHandle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // ER filter
    if (minER) {
      const minERValue = parseFloat(minER) / 100
      filtered = filtered.filter(inf => inf.erRate >= minERValue)
    }

    setFilteredInfluencers(filtered)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toFixed(0)
  }

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(2) + '%'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/buznes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              INFLUENCER VETTING
            </h1>
            <p className="text-gray-600 mt-1">
              Find and vet KOLs based on historical performance
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search Influencer</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
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
              <label className="text-sm font-medium mb-2 block">Tier</label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="Nano">Nano</SelectItem>
                  <SelectItem value="Micro">Micro</SelectItem>
                  <SelectItem value="Macro">Macro</SelectItem>
                  <SelectItem value="Mega">Mega</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Min ER%</label>
              <Input
                type="number"
                placeholder="e.g., 1.0"
                value={minER}
                onChange={(e) => setMinER(e.target.value)}
                step="0.1"
              />
            </div>
          </div>

          <div className="mt-4">
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
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Influencers ({filteredInfluencers.length})</CardTitle>
          <CardDescription>
            Click on an influencer to see detailed performance history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredInfluencers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No influencers found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Socmed Handle</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>SoW</TableHead>
                    <TableHead>Followers/Subs</TableHead>
                    <TableHead>Reach</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>ER%</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInfluencers.map((influencer) => (
                    <TableRow key={influencer.id} className="hover:bg-gray-50 cursor-pointer">
                      <TableCell className="font-medium">@{influencer.socmedHandle}</TableCell>
                      <TableCell>{influencer.platform}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {influencer.tier}
                        </span>
                      </TableCell>
                      <TableCell>{formatNumber(influencer.followers)}</TableCell>
                      <TableCell>{formatNumber(influencer.avgReach)}</TableCell>
                      <TableCell>{formatNumber(influencer.avgViews)}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          influencer.erRate >= 0.01 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formatPercentage(influencer.erRate)}
                        </span>
                      </TableCell>
                      <TableCell>{influencer.kolCategory || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

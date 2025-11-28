'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BrandData {
  name: string
  website: string
  instagramHandle: string
  tiktokHandle: string
  twitterHandle: string
  youtubeHandle: string
  facebookHandle: string
}

const emptyBrand: BrandData = {
  name: '',
  website: '',
  instagramHandle: '',
  tiktokHandle: '',
  twitterHandle: '',
  youtubeHandle: '',
  facebookHandle: ''
}

export default function NewAnalysisPage() {
  const [title, setTitle] = useState('')
  const [focusBrand, setFocusBrand] = useState<BrandData>(emptyBrand)
  const [competitors, setCompetitors] = useState<BrandData[]>([])
  const [customizeUniverseKeywords, setCustomizeUniverseKeywords] = useState(false)
  const [universeKeywords, setUniverseKeywords] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const addCompetitor = () => {
    if (competitors.length >= 3) {
      toast({
        title: 'Limit Reached',
        description: 'Maximum 3 competitors allowed',
        variant: 'destructive'
      })
      return
    }
    setCompetitors([...competitors, { ...emptyBrand }])
  }

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index))
  }

  const updateFocusBrand = (field: keyof BrandData, value: string) => {
    setFocusBrand({ ...focusBrand, [field]: value })
  }

  const updateCompetitor = (index: number, field: keyof BrandData, value: string) => {
    const updated = [...competitors]
    updated[index] = { ...updated[index], [field]: value }
    setCompetitors(updated)
  }

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter analysis title',
        variant: 'destructive'
      })
      return false
    }

    if (!focusBrand.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter focus brand name',
        variant: 'destructive'
      })
      return false
    }

    // Check if at least one social media handle or website is provided for focus brand
    const hasFocusData = focusBrand.website || focusBrand.instagramHandle ||
      focusBrand.tiktokHandle || focusBrand.twitterHandle ||
      focusBrand.youtubeHandle || focusBrand.facebookHandle

    if (!hasFocusData) {
      toast({
        title: 'Validation Error',
        description: 'Please provide at least one social media handle or website for focus brand',
        variant: 'destructive'
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          focusBrand,
          competitors: competitors.filter(c => c.name.trim() !== ''),
          universeKeywords: customizeUniverseKeywords && universeKeywords.trim() ? universeKeywords : undefined
        })
      })

      if (res.ok) {
        toast({
          title: 'Success!',
          description: 'Analysis started. You will be notified when complete.'
        })
        router.push('/dashboard')
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create analysis',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while creating analysis',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderBrandFields = (
    brand: BrandData,
    updateFn: (field: keyof BrandData, value: string) => void,
    label: string
  ) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">{label}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${label}-name`}>Brand Name *</Label>
          <Input
            id={`${label}-name`}
            value={brand.name}
            onChange={(e) => updateFn('name', e.target.value)}
            placeholder="e.g., Starbucks"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${label}-website`}>Website URL</Label>
          <Input
            id={`${label}-website`}
            type="url"
            value={brand.website}
            onChange={(e) => updateFn('website', e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${label}-instagram`}>Instagram Handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">@</span>
            <Input
              id={`${label}-instagram`}
              value={brand.instagramHandle}
              onChange={(e) => updateFn('instagramHandle', e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${label}-tiktok`}>TikTok Handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">@</span>
            <Input
              id={`${label}-tiktok`}
              value={brand.tiktokHandle}
              onChange={(e) => updateFn('tiktokHandle', e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${label}-twitter`}>Twitter/X Handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">@</span>
            <Input
              id={`${label}-twitter`}
              value={brand.twitterHandle}
              onChange={(e) => updateFn('twitterHandle', e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${label}-youtube`}>YouTube Handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">@</span>
            <Input
              id={`${label}-youtube`}
              value={brand.youtubeHandle}
              onChange={(e) => updateFn('youtubeHandle', e.target.value)}
              placeholder="channel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${label}-facebook`}>Facebook Handle</Label>
          <Input
            id={`${label}-facebook`}
            value={brand.facebookHandle}
            onChange={(e) => updateFn('facebookHandle', e.target.value)}
            placeholder="page name"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Analysis</h1>
          <p className="text-gray-500 mt-1">Create a new brand comparison analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Analysis Title */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Details</CardTitle>
            <CardDescription>Give your analysis a descriptive title</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="title">Analysis Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q1 2025 Coffee Brand Analysis"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Share of Voice Universe Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Share of Voice Configuration</CardTitle>
            <CardDescription>
              Customize universe keywords for Share of Voice analysis (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customize-keywords"
                checked={customizeUniverseKeywords}
                onCheckedChange={(checked) => setCustomizeUniverseKeywords(checked as boolean)}
              />
              <Label
                htmlFor="customize-keywords"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Customize universe keywords for Share of Voice analysis
              </Label>
            </div>

            {customizeUniverseKeywords && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="universe-keywords">Universe Keywords</Label>
                <Input
                  id="universe-keywords"
                  value={universeKeywords}
                  onChange={(e) => setUniverseKeywords(e.target.value)}
                  placeholder="e.g., air minum, air mineral, mineral water, hidrasi"
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Enter comma-separated keywords that define the conversation universe for your brands.
                  If left empty, keywords will be auto-detected based on brand category.
                </p>
              </div>
            )}

            {!customizeUniverseKeywords && (
              <div className="pl-6 text-sm text-gray-600">
                Universe keywords will be automatically detected based on brand names and category
                (e.g., water brands → "air minum, air mineral, mineral water")
              </div>
            )}
          </CardContent>
        </Card>

        {/* Focus Brand */}
        <Card>
          <CardHeader>
            <CardTitle>Focus Brand</CardTitle>
            <CardDescription>
              Enter details for the main brand you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderBrandFields(
              focusBrand,
              updateFocusBrand,
              'focus-brand'
            )}
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Competitors (Optional)</CardTitle>
                <CardDescription>
                  Add up to 3 competitor brands for comparison
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompetitor}
                disabled={competitors.length >= 3}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Competitor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {competitors.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No competitors added yet. Click "Add Competitor" to start.
              </p>
            ) : (
              competitors.map((competitor, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeCompetitor(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>

                  {renderBrandFields(
                    competitor,
                    (field, value) => updateCompetitor(index, field, value),
                    `competitor-${index + 1}`
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              'Start Analysis'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

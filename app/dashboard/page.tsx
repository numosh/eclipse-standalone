'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Clock, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface AnalysisSession {
  id: string
  title: string
  status: string
  createdAt: string
  completedAt?: string
  notificationRead: boolean
  focusBrand: {
    name: string
  } | null
  competitors: {
    name: string
  }[]
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions()
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return
    }

    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Analysis deleted successfully'
        })
        fetchSessions()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete analysis',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const classes = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status as keyof typeof classes] || classes.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage and view your brand analysis projects</p>
        </div>
        <Link href="/dashboard/new">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {sessions.filter(s => s.status === 'completed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {sessions.filter(s => s.status === 'processing').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {sessions.filter(s => s.status === 'failed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Analysis List */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Projects</CardTitle>
          <CardDescription>View and manage all your brand analysis sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No analysis projects yet</p>
              <Link href="/dashboard/new">
                <Button variant="outline">Create Your First Analysis</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${!session.notificationRead && session.status === 'completed' ? 'border-primary bg-purple-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(session.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.title}
                        </h3>
                        {getStatusBadge(session.status)}
                        {!session.notificationRead && session.status === 'completed' && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            New
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Focus Brand:</span> {session.focusBrand?.name || 'N/A'}
                        </p>
                        {session.competitors.length > 0 && (
                          <p>
                            <span className="font-medium">Competitors:</span>{' '}
                            {session.competitors.map(c => c.name).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                          {session.completedAt && ` • Completed ${formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {session.status === 'completed' && (
                        <Link href={`/dashboard/analysis/${session.id}`}>
                          <Button size="sm" variant="default">
                            <Eye className="w-4 h-4 mr-1" />
                            View Results
                          </Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

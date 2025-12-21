"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BarChart3, Users, Globe, ArrowRight } from 'lucide-react'

interface SourcePlatformData {
  source: string
  platform: string
  postCount: number
  totalEngagement: number
  avgEngagement: number
}

interface SourcePlatformGraphProps {
  posts: any[]
  width?: number
  height?: number
}

export function SourcePlatformGraph({ posts, width = 800, height = 400 }: SourcePlatformGraphProps) {
  const [selectedConnection, setSelectedConnection] = useState<SourcePlatformData | null>(null)
  const [sortBy, setSortBy] = useState<'posts' | 'engagement'>('posts')

  // Process data to create source-platform connections
  const { connections, sources, platforms, metrics } = useMemo(() => {
    if (!posts || posts.length === 0) {
      return { connections: [], sources: [], platforms: [], metrics: null }
    }

    const sourcePlatformMap = new Map<string, SourcePlatformData>()
    const sourceSet = new Set<string>()
    const platformSet = new Set<string>()
    let totalEngagement = 0
    let totalPosts = 0

    posts.forEach(post => {
      const key = `${post.source}-${post.platform}`
      const engagement = (post.reactions || 0) + (post.shares || 0) + (post.comments || 0)

      sourceSet.add(post.source)
      platformSet.add(post.platform)
      totalEngagement += engagement
      totalPosts++

      if (sourcePlatformMap.has(key)) {
        const existing = sourcePlatformMap.get(key)!
        existing.postCount++
        existing.totalEngagement += engagement
        existing.avgEngagement = existing.totalEngagement / existing.postCount
      } else {
        sourcePlatformMap.set(key, {
          source: post.source,
          platform: post.platform,
          postCount: 1,
          totalEngagement: engagement,
          avgEngagement: engagement
        })
      }
    })

    const connections = Array.from(sourcePlatformMap.values())
    const sortedConnections = connections.sort((a, b) =>
      sortBy === 'engagement' ? b.totalEngagement - a.totalEngagement : b.postCount - a.postCount
    )

    return {
      connections: sortedConnections,
      sources: Array.from(sourceSet),
      platforms: Array.from(platformSet),
      metrics: {
        totalEngagement,
        totalPosts,
        avgEngagementPerPost: totalEngagement / totalPosts
      }
    }
  }, [posts, sortBy])

  const getEngagementColor = (engagement: number, maxEngagement: number) => {
    const intensity = Math.min(engagement / maxEngagement, 1)
    const red = Math.round(255 * intensity)
    const green = Math.round(200 * (1 - intensity))
    const blue = Math.round(100)
    return `rgb(${red}, ${green}, ${blue})`
  }

  const getSourceMetrics = (source: string) => {
    const sourceConnections = connections.filter(c => c.source === source)
    return {
      totalPosts: sourceConnections.reduce((sum, c) => sum + c.postCount, 0),
      totalEngagement: sourceConnections.reduce((sum, c) => sum + c.totalEngagement, 0),
      platformCount: sourceConnections.length
    }
  }

  const getPlatformMetrics = (platform: string) => {
    const platformConnections = connections.filter(c => c.platform === platform)
    return {
      totalPosts: platformConnections.reduce((sum, c) => sum + c.postCount, 0),
      totalEngagement: platformConnections.reduce((sum, c) => sum + c.totalEngagement, 0),
      sourceCount: platformConnections.length
    }
  }

  const maxEngagement = Math.max(...connections.map(c => c.totalEngagement), 1)

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <CardTitle className="text-lg text-white">Source-Platform Distribution</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === 'posts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('posts')}
            className={sortBy === 'posts' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
          >
            By Posts
          </Button>
          <Button
            variant={sortBy === 'engagement' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('engagement')}
            className={sortBy === 'engagement' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
          >
            By Engagement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Metrics Overview */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Total Sources
                </div>
                <div className="text-2xl font-bold text-white">{sources.length}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Globe className="w-4 h-4" />
                  Total Platforms
                </div>
                <div className="text-2xl font-bold text-white">{platforms.length}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <ArrowRight className="w-4 h-4" />
                  Connections
                </div>
                <div className="text-2xl font-bold text-white">{connections.length}</div>
              </div>
            </div>
          )}

          {/* Connection List */}
          <div className="space-y-2">
            {connections.slice(0, 10).map((conn, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="bg-gray-900 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                      onClick={() => setSelectedConnection(conn)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">{conn.source}</span>
                          <span className="text-gray-400">→</span>
                          <Badge variant="outline" className="border-purple-600 text-purple-300">
                            {conn.platform}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-300">{conn.postCount} posts</span>
                          <span className="text-green-400 font-semibold">{conn.totalEngagement.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">{conn.source} → {conn.platform}</p>
                      <p className="text-sm">Posts: {conn.postCount}</p>
                      <p className="text-sm">Engagement: {conn.totalEngagement.toLocaleString()}</p>
                      <p className="text-sm">Avg: {conn.avgEngagement.toLocaleString()}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
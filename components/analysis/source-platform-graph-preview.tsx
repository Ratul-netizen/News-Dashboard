"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network, TrendingUp, Users, Link } from 'lucide-react'

interface Post {
  id: string
  postText: string
  postDate: Date
  postLink: string | null
  platform: string
  source: string
  reactions: number
  shares: number
  comments: number
  sentiment: string | null
}

interface SourcePlatformGraphPreviewProps {
  posts: Post[]
  onOpenFullGraph: () => void
}

// Platform code to name mapping (for single-letter codes)
const PLATFORM_CODE_MAP: { [key: string]: string } = {
  'F': 'facebook',
  'Y': 'youtube',
  'T': 'twitter',
  'X': 'x',
  'I': 'instagram',
  'L': 'linkedin',
  'R': 'reddit',
  'N': 'news',
  'TT': 'tiktok',
  'default': 'default'
}

// Platform color mapping (same as main modal)
const PLATFORM_COLORS: { [key: string]: string } = {
  'facebook': '#1877F2',
  'youtube': '#FF0000',
  'twitter': '#1DA1F2',
  'x': '#000000',
  'instagram': '#E4405F',
  'linkedin': '#0A66C2',
  'reddit': '#FF4500',
  'news': '#808080',
  'website': '#10B981',
  'blog': '#F59E0B',
  'telegram': '#0088CC',
  'whatsapp': '#25D366',
  'tiktok': '#000000',
  'default': '#6B7280'
}

export function SourcePlatformGraphPreview({ posts, onOpenFullGraph }: SourcePlatformGraphPreviewProps) {
  // Generate basic metrics for preview
  const metrics = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        totalSources: 0,
        totalPlatforms: 0,
        totalConnections: 0,
        totalPosts: 0,
        topPlatforms: [],
        topSources: []
      }
    }

    const uniqueSources = Array.from(new Set(posts.map(p => p.source)))
    const uniquePlatforms = Array.from(new Set(posts.map(p => p.platform)))

    // Count connections
    const connections = new Set<string>()
    posts.forEach(post => {
      connections.add(`${post.source}-${post.platform}`)
    })

    // Get top platforms by post count
    const platformCounts = posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    const topPlatforms = Object.entries(platformCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([platform, count]) => ({ platform, count }))

    // Get top sources by post count
    const sourceCounts = posts.reduce((acc, post) => {
      acc[post.source] = (acc[post.source] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    const topSources = Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source, count]) => ({ source, count }))

    return {
      totalSources: uniqueSources.length,
      totalPlatforms: uniquePlatforms.length,
      totalConnections: connections.size,
      totalPosts: posts.length,
      topPlatforms,
      topSources
    }
  }, [posts])

  // Get platform color - handles both single-letter codes and full names
  const getPlatformColor = (platform: string) => {
    // First check if it's a single-letter code (F, Y, T, N, etc.)
    const upperCode = platform.toUpperCase()
    if (PLATFORM_CODE_MAP[upperCode]) {
      const platformName = PLATFORM_CODE_MAP[upperCode]
      return PLATFORM_COLORS[platformName] || PLATFORM_COLORS.default
    }
    // Otherwise try direct lookup with normalized name
    const normalizedPlatform = platform.toLowerCase()
    return PLATFORM_COLORS[normalizedPlatform] || PLATFORM_COLORS.default
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No network data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-lg text-white">Source-Platform Network</CardTitle>
          </div>
          <Button
            onClick={onOpenFullGraph}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            View Full Graph
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              Sources
            </div>
            <div className="text-xl font-bold text-white">{metrics.totalSources}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Platforms
            </div>
            <div className="text-xl font-bold text-white">{metrics.totalPlatforms}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
              <Link className="w-4 h-4" />
              Connections
            </div>
            <div className="text-xl font-bold text-white">{metrics.totalConnections}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
              <Network className="w-4 h-4" />
              Posts
            </div>
            <div className="text-xl font-bold text-white">{metrics.totalPosts}</div>
          </div>
        </div>

        {/* Mini Network Visualization */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">Network Preview</h3>
          <div className="flex items-center justify-center space-x-8">
            {/* Sources Column */}
            <div className="space-y-2">
              <div className="text-xs text-gray-400 text-center mb-2">Sources</div>
              {metrics.topSources.map(({ source, count }, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="text-xs text-gray-300 truncate max-w-[100px]" title={source}>
                    {source.length > 12 ? source.substring(0, 10) + '...' : source}
                  </div>
                  <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Connections */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <Link className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500 mt-1">Network</div>
            </div>

            {/* Platforms Column */}
            <div className="space-y-2">
              <div className="text-xs text-gray-400 text-center mb-2">Platforms</div>
              {metrics.topPlatforms.map(({ platform, count }, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPlatformColor(platform) }}
                  ></div>
                  <div className="text-xs text-gray-300 capitalize">{platform}</div>
                  <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-3">
            Interactive network visualization with {metrics.totalSources} sources and {metrics.totalPlatforms} platforms
          </p>
          <Button
            onClick={onOpenFullGraph}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-900 hover:text-blue-300"
          >
            <Network className="w-4 h-4 mr-2" />
            Explore Full Source-Platform Network
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
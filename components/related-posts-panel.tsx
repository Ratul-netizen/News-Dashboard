'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingPost } from '@/lib/types'
import { formatScore } from '@/lib/utils/score-formatter'
import { ExternalLink, Users, Share2, MessageCircle } from 'lucide-react'

interface RelatedPostsPanelProps {
  relatedPosts: TrendingPost[]
  sources: string[]
  platforms: string[]
  onPostClick?: (post: TrendingPost) => void
}

export function RelatedPostsPanel({ 
  relatedPosts, 
  sources, 
  platforms, 
  onPostClick 
}: RelatedPostsPanelProps) {
  const getCategoryBadgeClass = (category?: string | null) => {
    switch ((category || 'uncategorized').toLowerCase()) {
      case 'politics': return 'border-blue-500 text-blue-500'
      case 'crime': return 'border-red-500 text-red-500'
      case 'corruption': return 'border-orange-500 text-orange-500'
      case 'accident': return 'border-yellow-500 text-yellow-500'
      case 'business': return 'border-emerald-500 text-emerald-500'
      case 'technology': return 'border-purple-500 text-purple-500'
      case 'entertainment': return 'border-pink-500 text-pink-500'
      case 'cyber crime': return 'border-indigo-500 text-indigo-500'
      case 'international': return 'border-teal-500 text-teal-500'
      case 'national': return 'border-cyan-500 text-cyan-500'
      case 'sports': return 'border-lime-500 text-lime-500'
      case 'health': return 'border-rose-500 text-rose-500'
      case 'education': return 'border-violet-500 text-violet-500'
      case 'environment': return 'border-green-500 text-green-500'
      case 'science': return 'border-sky-500 text-sky-500'
      default: return 'border-gray-500 text-gray-500'
    }
  }

  const getSentimentBadgeClass = (sentiment?: string | null) => {
    switch ((sentiment || 'neutral').toLowerCase()) {
      case 'positive': return 'border-green-500 text-green-500'
      case 'negative': return 'border-red-500 text-red-500'
      default: return 'border-gray-500 text-gray-500'
    }
  }

  if (!relatedPosts || relatedPosts.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Related Posts ({relatedPosts.length})
        </CardTitle>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>Sources:</span>
            {sources.map((source, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {source}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span>Platforms:</span>
            {platforms.map((platform, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relatedPosts.slice(0, 5).map((post, index) => (
            <div
              key={post.id}
              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onPostClick?.(post)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryBadgeClass(post.category)}`}
                    >
                      {post.category || 'uncategorized'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSentimentBadgeClass(post.sentiment)}`}
                    >
                      {post.sentiment}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.source}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2 mb-2">
                    {post.postText}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {formatScore(post.reactions)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatScore(post.comments)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatScore(post.shares)}
                    </div>
                  </div>
                </div>
                {post.postLink && (
                  <a
                    href={post.postLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
          {relatedPosts.length > 5 && (
            <div className="text-center text-sm text-muted-foreground">
              +{relatedPosts.length - 5} more related posts
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

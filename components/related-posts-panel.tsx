'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingPost } from '@/lib/types'
import { formatScore, getCategoryWeightColor } from '@/lib/utils/score-formatter'
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
                      className="text-xs"
                      style={{ 
                        borderColor: getCategoryWeightColor(post.category || 'uncategorized'),
                        color: getCategoryWeightColor(post.category || 'uncategorized')
                      }}
                    >
                      {post.category || 'uncategorized'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: getCategoryWeightColor(post.sentiment),
                        color: getCategoryWeightColor(post.sentiment)
                      }}
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

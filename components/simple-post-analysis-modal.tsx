'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ExternalLink,
  Hash,
  Users,
  Globe,
  TrendingUp,
  Heart,
  Share2,
  MessageCircle,
  Calendar,
  BarChart3,
} from 'lucide-react'
import type { TrendingPost } from '@/lib/types'
import dayjs from 'dayjs'
import { RelatedPostsPanel } from './related-posts-panel'
import { useState, useEffect } from 'react'

interface SimplePostAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  post: TrendingPost | null
}

export function SimplePostAnalysisModal({ isOpen, onClose, post }: SimplePostAnalysisModalProps) {
  const [relatedPosts, setRelatedPosts] = useState<TrendingPost[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  // Fetch related posts when modal opens
  useEffect(() => {
    if (isOpen && post) {
      fetchRelatedPosts()
    }
  }, [isOpen, post])

  const fetchRelatedPosts = async () => {
    if (!post) return
    
    try {
      setLoadingRelated(true)
      const response = await fetch(`/api/posts/related/${post.id}`)
      if (response.ok) {
        const data = await response.json()
        setRelatedPosts(data.data.relatedPosts || [])
      }
    } catch (error) {
      console.error('Error fetching related posts:', error)
    } finally {
      setLoadingRelated(false)
    }
  }

  if (!post) return null

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-900 text-green-300 border-green-700'
      case 'negative': return 'bg-red-900 text-red-300 border-red-700'
      case 'neutral': return 'bg-gray-700 text-gray-300 border-gray-600'
      default: return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'politics': return 'bg-blue-900 text-blue-100 border-blue-700'
      case 'crime': return 'bg-red-900 text-red-100 border-red-700'
      case 'corruption': return 'bg-orange-900 text-orange-100 border-orange-700'
      case 'accident': return 'bg-yellow-900 text-yellow-100 border-yellow-700'
      case 'business': return 'bg-emerald-900 text-emerald-100 border-emerald-700'
      case 'technology': return 'bg-purple-900 text-purple-100 border-purple-700'
      case 'entertainment': return 'bg-pink-900 text-pink-100 border-pink-700'
      case 'cyber crime': return 'bg-indigo-900 text-indigo-100 border-indigo-700'
      case 'international': return 'bg-teal-900 text-teal-100 border-teal-700'
      case 'national': return 'bg-cyan-900 text-cyan-100 border-cyan-700'
      case 'sports': return 'bg-lime-900 text-lime-100 border-lime-700'
      case 'health': return 'bg-rose-900 text-rose-100 border-rose-700'
      case 'education': return 'bg-violet-900 text-violet-100 border-violet-700'
      case 'environment': return 'bg-green-800 text-green-200 border-green-600'
      case 'science': return 'bg-sky-900 text-sky-100 border-sky-700'
      default: return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Post Analysis</DialogTitle>
          <DialogDescription className="text-gray-400">
            Detailed analysis of "{post.postText.substring(0, 50)}..."
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Header Badges */}
            <div className="flex flex-wrap gap-3">
              {post.category && (
                <Badge className={`${getCategoryColor(post.category)}`}>
                  <Hash className="w-3 h-3 mr-1" />
                  {post.category}
                </Badge>
              )}
              <Badge className="bg-green-900 text-green-100">
                <Users className="w-3 h-3 mr-1" />
                {post.sourceCount} Sources
              </Badge>
              <Badge className="bg-purple-900 text-purple-100">
                <Globe className="w-3 h-3 mr-1" />
                {post.platform}
              </Badge>
              <Badge className="bg-yellow-900 text-yellow-100">
                <TrendingUp className="w-3 h-3 mr-1" />
                Score: {post.trendingScore.toFixed(1)}
              </Badge>
            </div>

            {/* Post Content */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Post Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {dayjs(post.postDate).format('MMM DD, YYYY [at] HH:mm')}
                  </div>
                  <p className="text-gray-300 leading-relaxed">{post.postText}</p>
                  {post.postLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <a href={post.postLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Original Post
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Reactions</p>
                      <p className="text-2xl font-bold text-red-400">
                        {formatNumber(post.reactions)}
                      </p>
                    </div>
                    <Heart className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Shares</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatNumber(post.shares)}
                      </p>
                    </div>
                    <Share2 className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Comments</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {formatNumber(post.comments)}
                      </p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Scoring Metrics */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Scoring Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Virality Score</p>
                    <p className="text-xl font-bold text-yellow-400">{post.viralityScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Source Weight</p>
                    <p className="text-xl font-bold text-blue-400">{post.sourceWeight.toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">News Flow Weight</p>
                    <p className="text-xl font-bold text-green-400">{post.newsFlowWeight.toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Final Score</p>
                    <p className="text-xl font-bold text-purple-400">{post.finalTrendingScore.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Analysis */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge className={`text-lg px-4 py-2 ${getSentimentColor(post.sentiment)}`}>
                    {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
                  </Badge>
                  <div className="text-gray-400">
                    <p className="text-sm">Based on content analysis and engagement patterns</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post Analysis Data (if available) */}
            {post.postAnalysis && (
              <>
                <Separator className="bg-gray-700" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Related Sources ({post.postAnalysis.sources.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {post.postAnalysis.sources.map((source, index) => (
                          <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 mr-2 mb-2">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Platforms ({post.postAnalysis.platforms.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {post.postAnalysis.platforms.map((platform, index) => (
                          <Badge key={index} variant="outline" className="border-purple-600 text-purple-300">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Related Posts Panel */}
            {post.postAnalysis && (
              <RelatedPostsPanel
                relatedPosts={relatedPosts}
                sources={post.postAnalysis.sources}
                platforms={post.postAnalysis.platforms}
                onPostClick={(relatedPost) => {
                  // Handle related post click
                  console.log('Related post clicked:', relatedPost)
                }}
              />
            )}
            
            {/* Loading State for Related Posts */}
            {loadingRelated && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <div className="text-gray-400">Loading related posts...</div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

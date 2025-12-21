'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  Copy,
  Check,
  Network,
} from 'lucide-react'
import type { TrendingPost } from '@/lib/types'
import dayjs from 'dayjs'
import { useState, useEffect } from 'react'
import { SourcePlatformGraphModal } from './analysis/source-platform-graph-modal'
import { SourcePlatformGraphPreview } from './analysis/source-platform-graph-preview'

interface NewsItemDetails {
  newsItem: {
    id: string
    groupKey: string
    category: string | null
    primarySource: string
    primaryPlatform: string
    totalReactions: number
    totalShares: number
    totalComments: number
    sourceCount: number
    platformCount: number
    postCount: number
    avgTrendingScore: number
    firstPostDate: Date
    lastPostDate: Date
    postAnalysis: {
      sources: string[]
      platforms: string[]
      sampleTexts?: string[]
      postLinks?: string[]
      totalEngagement?: number
      sentimentBreakdown?: {
        positive: number
        neutral: number
        negative: number
      }
    } | null
  }
  posts: Array<{
    id: string
    postId: string
    postText: string
    postDate: Date
    postLink: string | null
    platform: string
    source: string
    reactions: number
    shares: number
    comments: number
    sentiment: string | null
    featuredImagesPath: string | null
  }>
  dailyEngagement?: Array<{
    date: string
    reactions: number
    shares: number
    comments: number
    posts: number
  }>
  relatedNews?: Array<{
    id: string
    category: string | null
    primarySource: string
    totalReactions: number
    postCount: number
    firstPostDate: Date
  }>
}

interface SimplePostAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  post: TrendingPost | null
}

export function SimplePostAnalysisModal({ isOpen, onClose, post }: SimplePostAnalysisModalProps) {
  const [newsItemData, setNewsItemData] = useState<NewsItemDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [graphModalOpen, setGraphModalOpen] = useState(false)

  // Fetch NewsItem details with all related posts when modal opens
  useEffect(() => {
    if (isOpen && post) {
      fetchNewsItemDetails()
    }
  }, [isOpen, post])

  // Renamed for clarity, handles routing logic
  const fetchNewsItemDetails = async () => {
    if (!post) return

    // Helper: Logic to load raw post data (API or local)
    const loadRawPostData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analysis/related?postId=${post.id}`)

        if (response.ok) {
          const data = await response.json()
          if (data.type === 'group') {
            setNewsItemData(data)
          } else {
            // Virtual group
            const mainPost = data.mainPost
            const similarPosts = data.similarPosts || []
            const relatedNews = data.relatedNews || []

            const sentiment = mainPost.sentiment?.toLowerCase() || 'neutral'
            const singlePostAnalysis = {
              sources: Array.from(new Set(similarPosts.map((p: any) => p.source))) as string[],
              platforms: Array.from(new Set(similarPosts.map((p: any) => p.platform))) as string[],
              sampleTexts: [mainPost.postText],
              postLinks: mainPost.postLink ? [mainPost.postLink] : [],
              totalEngagement: similarPosts.reduce((acc: number, p: any) => acc + (p.reactions || 0) + (p.shares || 0) + (p.comments || 0), 0),
              sentimentBreakdown: {
                positive: similarPosts.filter((p: any) => p.sentiment?.toLowerCase().includes('positive')).length,
                neutral: similarPosts.filter((p: any) => p.sentiment?.toLowerCase().includes('neutral')).length,
                negative: similarPosts.filter((p: any) => p.sentiment?.toLowerCase().includes('negative')).length,
              }
            }

            setNewsItemData({
              newsItem: {
                id: mainPost.id,
                groupKey: mainPost.id,
                category: mainPost.category,
                primarySource: mainPost.source,
                primaryPlatform: mainPost.platform,
                totalReactions: singlePostAnalysis.totalEngagement,
                totalShares: similarPosts.reduce((acc: number, p: any) => acc + (p.shares || 0), 0),
                totalComments: similarPosts.reduce((acc: number, p: any) => acc + (p.comments || 0), 0),
                sourceCount: singlePostAnalysis.sources.length,
                platformCount: singlePostAnalysis.platforms.length,
                postCount: similarPosts.length,
                avgTrendingScore: mainPost.trendingScore,
                firstPostDate: mainPost.postDate,
                lastPostDate: mainPost.postDate,
                postAnalysis: singlePostAnalysis
              },
              posts: similarPosts.map((p: any) => ({
                id: p.id,
                postId: p.postId,
                postText: p.postText,
                postDate: p.postDate,
                postLink: p.postLink,
                platform: p.platform,
                source: p.source,
                reactions: p.reactions,
                shares: p.shares,
                comments: p.comments,
                sentiment: p.sentiment,
                featuredImagesPath: p.featuredImagesPath
              })),
              relatedNews: relatedNews
            })
          }
        } else {
          throw new Error("API failed")
        }
      } catch (e) {
        // Ultimate fallback: Local construction
        console.warn("Falling back to local data construction due to API error:", e)
        const sentiment = post.sentiment?.toLowerCase() || 'neutral'
        setNewsItemData({
          newsItem: {
            id: post.id,
            groupKey: post.id,
            category: post.category,
            primarySource: post.source,
            primaryPlatform: post.platform,
            totalReactions: post.reactions,
            totalShares: post.shares,
            totalComments: post.comments,
            sourceCount: 1,
            platformCount: 1,
            postCount: 1,
            avgTrendingScore: post.trendingScore,
            firstPostDate: post.postDate,
            lastPostDate: post.postDate,
            postAnalysis: {
              sources: [post.source],
              platforms: [post.platform],
              sentimentBreakdown: {
                positive: sentiment === 'positive' ? 1 : 0,
                neutral: sentiment === 'neutral' ? 1 : 0,
                negative: sentiment === 'negative' ? 1 : 0,
              }
            } as any
          },
          posts: [{
            id: post.id,
            postId: post.id,
            postText: post.postText,
            postDate: post.postDate,
            postLink: post.postLink,
            platform: post.platform,
            source: post.source,
            reactions: post.reactions,
            shares: post.shares,
            comments: post.comments,
            sentiment: post.sentiment,
            featuredImagesPath: null
          }]
        })
      } finally {
        setLoading(false)
      }
    }

    // 1. If explicitly raw post, load raw
    if (post.type === 'raw-post') {
      await loadRawPostData()
      return
    }

    // 2. Otherwise/Default: Try to load as News Group
    try {
      setLoading(true)
      const response = await fetch(`/api/news-item/${post.id}`)
      if (response.ok) {
        const data = await response.json()
        setNewsItemData(data)
        setLoading(false)
      } else {
        // 3. Fallback: If 404/Error, it might be a raw post with missing 'type'
        console.warn('Failed to fetch news item, trying raw post fallback...')
        await loadRawPostData()
      }
    } catch (error) {
      console.error('Error fetching news item details, trying fallback:', error)
      await loadRawPostData()
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

  // Helper subcomponents
  function ExpandableText({ text, maxChars = 450 }: { text: string; maxChars?: number }) {
    const [expanded, setExpanded] = useState(false)
    const isLong = text.length > maxChars
    const displayText = expanded || !isLong ? text : text.substring(0, maxChars) + '...'
    return (
      <div className="space-y-2">
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{displayText}</p>
        {isLong && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </div>
    )
  }

  function CopyPostButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch (e) {
        // noop
      }
    }
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Post Analysis</DialogTitle>
            <DialogDescription className="text-gray-400">
              Detailed analysis of "{post.postText.substring(0, 50)}..."
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Loading analysis...</div>
              </div>
            ) : newsItemData ? (
              <div className="space-y-6">
                {/* Header Badges - Show from NewsItem data */}
                <div className="flex flex-wrap gap-3">
                  {newsItemData.newsItem.category && (
                    <Badge className={`${getCategoryColor(newsItemData.newsItem.category)}`}>
                      <Hash className="w-3 h-3 mr-1" />
                      {newsItemData.newsItem.category}
                    </Badge>
                  )}
                  <Badge className="bg-green-900 text-green-100">
                    <Users className="w-3 h-3 mr-1" />
                    {newsItemData.newsItem.sourceCount} Sources
                  </Badge>
                  <Badge className="bg-purple-900 text-purple-100">
                    <Globe className="w-3 h-3 mr-1" />
                    {newsItemData.newsItem.platformCount} Platforms
                  </Badge>
                  <Badge className="bg-yellow-900 text-yellow-100">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {newsItemData.newsItem.postCount} Posts
                  </Badge>
                </div>

                {/* Selected Post Content */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-white">Post Content</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {dayjs(post.postDate).format('MMM DD, YYYY [at] HH:mm')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.postLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <a href={post.postLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </a>
                        </Button>
                      )}
                      <CopyPostButton text={post.postText} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ExpandableText text={post.postText} maxChars={450} />
                  </CardContent>
                </Card>

                {/* Aggregated Engagement Metrics - Total across all posts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Reactions</p>
                          <p className="text-2xl font-bold text-red-400">
                            {formatNumber(newsItemData.newsItem.totalReactions)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Across all {newsItemData.newsItem.postCount} posts</p>
                        </div>
                        <Heart className="h-8 w-8 text-red-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Shares</p>
                          <p className="text-2xl font-bold text-green-400">
                            {formatNumber(newsItemData.newsItem.totalShares)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Across all {newsItemData.newsItem.postCount} posts</p>
                        </div>
                        <Share2 className="h-8 w-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Comments</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {formatNumber(newsItemData.newsItem.totalComments)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Across all {newsItemData.newsItem.postCount} posts</p>
                        </div>
                        <MessageCircle className="h-8 w-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sources and Platforms Section */}
                <Separator className="bg-gray-700" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        All Sources ({newsItemData.posts.length > 0 ? Array.from(new Set(newsItemData.posts.map(p => p.source))).length : 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {newsItemData.posts.length > 0 ? (
                          Array.from(new Set(newsItemData.posts.map(p => p.source))).map((source, index) => (
                            <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                              {source}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No sources found</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        All Platforms ({newsItemData.posts.length > 0 ? Array.from(new Set(newsItemData.posts.map(p => p.platform))).length : 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {newsItemData.posts.length > 0 ? (
                          Array.from(new Set(newsItemData.posts.map(p => p.platform))).map((platform, index) => (
                            <Badge key={index} variant="outline" className="border-purple-600 text-purple-300">
                              {platform}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No platforms found</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Analysis Graphs */}
                <SourcePlatformGraphPreview
                  posts={newsItemData?.posts || []}
                  onOpenFullGraph={() => setGraphModalOpen(true)}
                />

                {/* All Posts Table - Cross-platform and cross-source analysis */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        All Posts ({newsItemData.posts.length || newsItemData.newsItem.postCount || 0}) - Cross-Platform Analysis
                      </CardTitle>
                      <div className="text-xs text-gray-400 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-700">
                        <span className="text-red-400 font-semibold">{formatNumber(newsItemData.newsItem.totalReactions)}</span> reactions •
                        <span className="text-green-400 font-semibold"> {formatNumber(newsItemData.newsItem.totalShares)}</span> shares •
                        <span className="text-blue-400 font-semibold"> {formatNumber(newsItemData.newsItem.totalComments)}</span> comments
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Showing all posts from different sources and platforms for this news story. Click the link icon to view the original post.
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700 bg-gray-750">
                            <TableHead className="text-gray-300 font-semibold w-[140px]">Source</TableHead>
                            <TableHead className="text-gray-300 font-semibold w-[120px]">Platform</TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[300px]">Post Text</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-right w-[110px]">Reactions</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-right w-[100px]">Shares</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-right w-[110px]">Comments</TableHead>
                            <TableHead className="text-gray-300 font-semibold w-[110px]">Sentiment</TableHead>
                            <TableHead className="text-gray-300 font-semibold w-[130px]">Date</TableHead>
                            <TableHead className="text-gray-300 font-semibold w-[80px] text-center">Link</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newsItemData.posts.length > 0 ? (
                            newsItemData.posts.map((postItem) => (
                              <TableRow key={postItem.id} className="border-gray-700 hover:bg-gray-750/50 transition-colors">
                                <TableCell className="text-gray-200 font-medium py-3">
                                  <div className="truncate max-w-[140px]" title={postItem.source}>
                                    {postItem.source}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <Badge variant="outline" className="border-purple-600 text-purple-300 bg-purple-950/30">
                                    {postItem.platform}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-200 py-3">
                                  <div className="max-w-[400px]">
                                    <div className="line-clamp-2 text-sm leading-relaxed" title={postItem.postText}>
                                      {postItem.postText}
                                    </div>
                                    {postItem.postText.length > 150 && (
                                      <span className="text-xs text-gray-500 mt-1 block">
                                        {postItem.postText.length} characters
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-red-400 text-right font-mono font-semibold py-3">
                                  {formatNumber(postItem.reactions)}
                                </TableCell>
                                <TableCell className="text-green-400 text-right font-mono font-semibold py-3">
                                  {formatNumber(postItem.shares)}
                                </TableCell>
                                <TableCell className="text-blue-400 text-right font-mono font-semibold py-3">
                                  {formatNumber(postItem.comments)}
                                </TableCell>
                                <TableCell className="py-3">
                                  <Badge className={`text-xs ${getSentimentColor(postItem.sentiment || 'neutral')}`}>
                                    {(postItem.sentiment || 'neutral').charAt(0).toUpperCase() + (postItem.sentiment || 'neutral').slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-400 text-sm py-3">
                                  <div>
                                    <div>{dayjs(postItem.postDate).format('MMM DD, YYYY')}</div>
                                    <div className="text-xs text-gray-500">{dayjs(postItem.postDate).format('HH:mm')}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 text-center">
                                  {postItem.postLink ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                      className="h-8 w-8 p-0 hover:bg-gray-700"
                                    >
                                      <a href={postItem.postLink} target="_blank" rel="noopener noreferrer" title="Open original post">
                                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                                      </a>
                                    </Button>
                                  ) : (
                                    <span className="text-gray-600 text-xs">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-gray-500 py-12">
                                <div className="flex flex-col items-center gap-2">
                                  <BarChart3 className="w-8 h-8 text-gray-600" />
                                  <span>No posts found for this news item</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Related News Section */}
                {newsItemData.relatedNews && newsItemData.relatedNews.length > 0 && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Related News
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {newsItemData.relatedNews.map((news) => (
                          <Card key={news.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <Badge className={`${getCategoryColor(news.category || 'Other')}`}>
                                  {news.category}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {dayjs(news.firstPostDate).format('MMM DD')}
                                </span>
                              </div>
                              <div className="mb-3">
                                <p className="text-sm font-medium text-white mb-1">
                                  {news.primarySource} - {news.postCount} posts
                                </p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-red-400" /> {formatNumber(news.totalReactions)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-blue-400" /> {news.postCount} posts
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Failed to load analysis data</div>
              </div>
            )}

          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Source-Platform Graph Modal */}
      {newsItemData && (
        <SourcePlatformGraphModal
          isOpen={graphModalOpen}
          onClose={() => setGraphModalOpen(false)}
          posts={newsItemData.posts}
          mainPost={post}
        />
      )}
    </>
  )
}

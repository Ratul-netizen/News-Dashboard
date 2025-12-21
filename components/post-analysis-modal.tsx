"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  ExternalLink,
  Hash,
  Users,
  Globe,
  TrendingUp,
  Heart,
  Share2,
  MessageCircle,
  Smile,
  Meh,
  Frown,
  Network,
} from "lucide-react"
import type { PostAnalysis } from "@/lib/types"
import dayjs from "dayjs"
import { SourcePlatformGraphModal } from "./analysis/source-platform-graph-modal"
import { SourcePlatformGraphPreview } from "./analysis/source-platform-graph-preview"

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
    postAnalysis: PostAnalysis | null
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
  dailyEngagement: Array<{
    date: string
    reactions: number
    shares: number
    comments: number
    posts: number
  }>
}

interface PostAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string | null
}

const ENGAGEMENT_COLORS = {
  reactions: "#EF4444", // Red
  shares: "#10B981", // Green
  comments: "#3B82F6", // Blue
}

export function PostAnalysisModal({ isOpen, onClose, postId }: PostAnalysisModalProps) {
  const [data, setData] = useState<NewsItemDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [graphModalOpen, setGraphModalOpen] = useState(false)

  // Calculate sentiment breakdown from posts data
  const getSentimentData = (posts: any[]) => {
    console.log('=== getSentimentData FUNCTION ===')
    console.log('Input posts:', posts)
    console.log('Posts length:', posts?.length)
    console.log('Posts type:', typeof posts)
    console.log('Is array?', Array.isArray(posts))
    
    if (!posts || posts.length === 0) {
      console.log('No posts, returning empty data')
      return { counts: {}, chartData: [] }
    }
    
    console.log('Processing posts...')
    const sentimentCounts = posts.reduce((acc, post) => {
      console.log(`Processing post:`, post)
      console.log(`Post sentiment:`, post.sentiment)
      const sentiment = post.sentiment || 'neutral'
      console.log(`Using sentiment:`, sentiment)
      acc[sentiment] = (acc[sentiment] || 0) + 1
      console.log(`Updated counts:`, acc)
      return acc
    }, {})

    console.log('Final sentiment counts:', sentimentCounts)

    const chartData = [
      {
        name: "Positive",
        value: sentimentCounts.positive || 0,
        color: "#10B981",
      },
      {
        name: "Neutral",
        value: sentimentCounts.neutral || 0,
        color: "#6B7280",
      },
      {
        name: "Negative",
        value: sentimentCounts.negative || 0,
        color: "#EF4444",
      },
    ]

    console.log('Chart data:', chartData)
    return { counts: sentimentCounts, chartData }
  }

  useEffect(() => {
    if (isOpen && postId) {
      fetchNewsItemDetails()
    }
  }, [isOpen, postId])

  const fetchNewsItemDetails = async () => {
    if (!postId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/news-item/${postId}`)
      if (!response.ok) throw new Error("Failed to fetch news item details")

      const newsItemData = await response.json()
      setData(newsItemData)
    } catch (error) {
      console.error("Error fetching news item details:", error)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{dayjs(label).format("MMM DD, YYYY")}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!data && !loading) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Post Analysis Details</DialogTitle>
          <DialogDescription className="text-gray-400">
            Comprehensive analysis of grouped posts and engagement metrics
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading analysis...</div>
          </div>
        ) : data ? (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {/* Header Badges */}
              <div className="flex flex-wrap gap-3">
                {data.newsItem.category && (
                  <Badge className="bg-blue-900 text-blue-100">
                    <Hash className="w-3 h-3 mr-1" />
                    {data.newsItem.category}
                  </Badge>
                )}
                <Badge className="bg-green-900 text-green-100">
                  <Users className="w-3 h-3 mr-1" />
                  {data.newsItem.sourceCount} Sources
                </Badge>
                <Badge className="bg-purple-900 text-purple-100">
                  <Globe className="w-3 h-3 mr-1" />
                  {data.newsItem.platformCount} Platforms
                </Badge>
                <Badge className="bg-yellow-900 text-yellow-100">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Virality: {data.newsItem.avgTrendingScore.toFixed(1)}
                </Badge>
              </div>

              {/* Engagement Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Reactions</p>
                        <p className="text-2xl font-bold text-red-400">
                          {data.newsItem.totalReactions.toLocaleString()}
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
                        <p className="text-sm text-gray-400">Total Shares</p>
                        <p className="text-2xl font-bold text-green-400">
                          {data.newsItem.totalShares.toLocaleString()}
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
                        <p className="text-sm text-gray-400">Total Comments</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {data.newsItem.totalComments.toLocaleString()}
                        </p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Engagement Chart */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Daily Engagement Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={data.dailyEngagement}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#D1D5DB", fontSize: 12 }}
                          axisLine={{ stroke: "#6B7280" }}
                          tickFormatter={(value) => dayjs(value).format("MM/DD")}
                        />
                        <YAxis tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="reactions"
                          stroke={ENGAGEMENT_COLORS.reactions}
                          strokeWidth={2}
                          name="Reactions"
                        />
                        <Line
                          type="monotone"
                          dataKey="shares"
                          stroke={ENGAGEMENT_COLORS.shares}
                          strokeWidth={2}
                          name="Shares"
                        />
                        <Line
                          type="monotone"
                          dataKey="comments"
                          stroke={ENGAGEMENT_COLORS.comments}
                          strokeWidth={2}
                          name="Comments"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Sentiment Breakdown */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Sentiment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          console.log('=== FRONTEND DEBUG ===')
                          console.log('Data object:', data)
                          console.log('Posts array:', data.posts)
                          console.log('Posts length:', data.posts?.length)
                          console.log('Posts type:', typeof data.posts)
                          console.log('Is posts array?', Array.isArray(data.posts))
                          
                          if (data.posts && data.posts.length > 0) {
                            console.log('First post:', data.posts[0])
                            console.log('First post sentiment:', data.posts[0].sentiment)
                          }
                          
                          const { counts, chartData } = getSentimentData(data.posts || [])
                          console.log('Sentiment counts:', counts)
                          console.log('Chart data:', chartData)
                          
                          return (
                            <>
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    nameKey="name"
                                  >
                                    {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend wrapperStyle={{ color: "#D1D5DB" }} />
                                </PieChart>
                              </ResponsiveContainer>

                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Smile className="h-4 w-4 text-green-500" />
                                  <span className="text-gray-300">
                                    {counts.positive || 0} Positive
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Meh className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-300">
                                    {counts.neutral || 0} Neutral
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Frown className="h-4 w-4 text-red-500" />
                                  <span className="text-gray-300">
                                    {counts.negative || 0} Negative
                                  </span>
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>
              </div>

              {/* Sources and Platforms */}
              {data.newsItem.postAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Sources ({data.newsItem.sourceCount})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {data.newsItem.postAnalysis.sources.map((source, index) => (
                          <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 mr-2 mb-2">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Platforms ({data.newsItem.platformCount})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {data.newsItem.postAnalysis.platforms.map((platform, index) => (
                          <Badge key={index} variant="outline" className="border-purple-600 text-purple-300">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator className="bg-gray-700" />

              {/* Advanced Analysis Graphs */}
              <SourcePlatformGraphPreview
                posts={data.posts}
                onOpenFullGraph={() => setGraphModalOpen(true)}
              />

              <Separator className="bg-gray-700" />

              {/* Detailed Posts Table */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">All Related Posts ({data.posts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-gray-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Date</TableHead>
                          <TableHead className="text-gray-300">Platform</TableHead>
                          <TableHead className="text-gray-300">Source</TableHead>
                          <TableHead className="text-gray-300">Reactions</TableHead>
                          <TableHead className="text-gray-300">Shares</TableHead>
                          <TableHead className="text-gray-300">Comments</TableHead>
                          <TableHead className="text-gray-300">Sentiment</TableHead>
                          <TableHead className="text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.posts.map((post) => (
                          <TableRow key={post.id} className="border-gray-700">
                            <TableCell className="text-gray-300">
                              <div className="text-sm">
                                {dayjs(post.postDate).format("MMM DD")}
                                <div className="text-xs text-gray-500">{dayjs(post.postDate).format("HH:mm")}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-purple-600 text-purple-300">
                                {post.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300 max-w-32 truncate" title={post.source}>
                              {post.source}
                            </TableCell>
                            <TableCell className="text-red-400 font-semibold">
                              {post.reactions.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-green-400 font-semibold">
                              {post.shares.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-blue-400 font-semibold">
                              {post.comments.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {post.sentiment ? (
                                <Badge
                                  variant="outline"
                                  className={`border-gray-600 ${
                                    post.sentiment === "positive"
                                      ? "text-green-400"
                                      : post.sentiment === "negative"
                                        ? "text-red-400"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {post.sentiment}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 text-sm">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {post.postLink && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                >
                                  <a href={post.postLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Failed to load analysis data</div>
          </div>
        )}

        </DialogContent>
      </Dialog>

      {/* Source-Platform Graph Modal */}
      <SourcePlatformGraphModal
        isOpen={graphModalOpen}
        onClose={() => setGraphModalOpen(false)}
        posts={data?.posts || []}
      />
    </>
  )
}

"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, Clock, BarChart3, Calendar } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Area, AreaChart } from 'recharts'
import dayjs from 'dayjs'

interface TimelineData {
  date: string
  posts: number
  sources: string[]
  platforms: string[]
  totalEngagement: number
  reactions: number
  shares: number
  comments: number
}

interface ViralityTimelineGraphProps {
  posts: any[]
  width?: number
  height?: number
}

export function ViralityTimelineGraph({ posts, width = 800, height = 400 }: ViralityTimelineGraphProps) {
  const [selectedPoint, setSelectedPoint] = useState<TimelineData | null>(null)

  // Process timeline data
  const { timelineData, viralityMetrics } = useMemo(() => {
    if (!posts || posts.length === 0) {
      return { timelineData: [], viralityMetrics: null }
    }

    // Group posts by date
    const dateMap = new Map<string, TimelineData>()

    posts.forEach(post => {
      const date = dayjs(post.postDate).format('YYYY-MM-DD')
      const engagement = (post.reactions || 0) + (post.shares || 0) + (post.comments || 0)

      if (dateMap.has(date)) {
        const data = dateMap.get(date)!
        data.posts++
        data.totalEngagement += engagement
        data.reactions += post.reactions || 0
        data.shares += post.shares || 0
        data.comments += post.comments || 0

        if (!data.sources.includes(post.source)) {
          data.sources.push(post.source)
        }
        if (!data.platforms.includes(post.platform)) {
          data.platforms.push(post.platform)
        }
      } else {
        dateMap.set(date, {
          date,
          posts: 1,
          sources: [post.source],
          platforms: [post.platform],
          totalEngagement: engagement,
          reactions: post.reactions || 0,
          shares: post.shares || 0,
          comments: post.comments || 0
        })
      }
    })

    const timelineData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate virality metrics
    const totalEngagement = timelineData.reduce((sum, day) => sum + day.totalEngagement, 0)
    const totalPosts = timelineData.reduce((sum, day) => sum + day.posts, 0)
    const peakEngagement = Math.max(...timelineData.map(d => d.totalEngagement))
    const peakDay = timelineData.find(d => d.totalEngagement === peakEngagement)
    const avgEngagementPerDay = totalEngagement / timelineData.length

    return {
      timelineData,
      viralityMetrics: {
        totalEngagement,
        totalPosts,
        peakEngagement,
        peakDay,
        avgEngagementPerDay,
        duration: timelineData.length,
        sources: new Set(posts.map(p => p.source)).size,
        platforms: new Set(posts.map(p => p.platform)).size
      }
    }
  }, [posts])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimelineData
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{dayjs(label).format('MMM DD, YYYY')}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-300">Posts: {data.posts}</p>
            <p className="text-gray-300">Engagement: {data.totalEngagement.toLocaleString()}</p>
            <p className="text-gray-300">Sources: {data.sources.length}</p>
            <p className="text-gray-300">Platforms: {data.platforms.length}</p>
          </div>
        </div>
      )
    }
    return null
  }

  const formatXAxis = (tickItem: string) => {
    return dayjs(tickItem).format('MM/DD')
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <CardTitle className="text-lg text-white">Virality Timeline</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-orange-900 text-orange-100">
            Duration: {timelineData.length} days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Virality Metrics */}
          {viralityMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <BarChart3 className="w-4 h-4" />
                  Total Engagement
                </div>
                <div className="text-xl font-bold text-white">{viralityMetrics.totalEngagement.toLocaleString()}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Duration
                </div>
                <div className="text-xl font-bold text-white">{viralityMetrics.duration} days</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Peak Day
                </div>
                <div className="text-sm font-bold text-white">
                  {viralityMetrics.peakDay ? dayjs(viralityMetrics.peakDay.date).format('MMM DD') : 'N/A'}
                </div>
                <div className="text-xs text-gray-400">
                  {viralityMetrics.peakEngagement.toLocaleString()} engagement
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Daily Average
                </div>
                <div className="text-xl font-bold text-white">
                  {Math.round(viralityMetrics.avgEngagementPerDay).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Chart */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Engagement Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fill: "#D1D5DB", fontSize: 12 }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <YAxis
                  tick={{ fill: "#D1D5DB", fontSize: 12 }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalEngagement"
                  stroke="#F97316"
                  fill="#F97316"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Daily Breakdown</h3>
            <div className="space-y-2">
              {timelineData.slice(0, 5).map((day, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="bg-gray-900 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                        onClick={() => setSelectedPoint(day)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">
                              {dayjs(day.date).format('MMM DD, YYYY')}
                            </span>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="border-gray-600 text-gray-300">
                                {day.posts} posts
                              </Badge>
                              <Badge variant="outline" className="border-blue-600 text-blue-300">
                                {day.sources.length} sources
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-400">
                              {day.totalEngagement.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">engagement</div>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-2">
                        <p className="font-semibold">{dayjs(day.date).format('MMMM DD, YYYY')}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Reactions:</span>
                            <p className="text-white">{day.reactions.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Shares:</span>
                            <p className="text-white">{day.shares.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Comments:</span>
                            <p className="text-white">{day.comments.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Platforms:</span>
                            <p className="text-white">{day.platforms.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { FilterBar } from "@/components/filter-bar"
import { HighlightCards } from "@/components/highlight-cards"
import { TrendingPostsTable } from "@/components/trending-posts-table"
import { ChartsSection } from "@/components/charts-section"
import type { DashboardFilters, TrendingPost } from "@/lib/types"
import dayjs from "dayjs"

interface DashboardData {
  trendingPosts: TrendingPost[]
  allPosts: TrendingPost[]
  highlightMetrics: {
    mostLiked: { value: number; text: string; source: string; postLink: string | null; fullText: string; sentiment: string }
    mostShared: { value: number; text: string; source: string; postLink: string | null; fullText: string; sentiment: string }
    mostCommented: { value: number; text: string; source: string; postLink: string | null; fullText: string; sentiment: string }
  }
  chartData: {
    newsFlow: Array<{ category: string; count: number; reactions: number; shares: number; comments: number }>
    sourceEngagement: Array<{ source: string; reactions: number; shares: number; comments: number }>
    categoryTrending: Array<{ category: string; posts: number }>
    categoryReactions: Array<{ category: string; reactions: number }>
    sentimentDistribution: Array<{ sentiment: string; count: number }>
  }
  filterOptions: {
    categories: string[]
    sources: string[]
    platforms: string[]
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: dayjs().subtract(7, "days").toDate(),
      to: new Date(),
    },
    categories: [],
    sources: [],
    platforms: [],
  })

  const filteredPosts = useMemo(() => {
    if (!data?.trendingPosts || !searchQuery.trim()) {
      return data?.trendingPosts || []
    }

    const query = searchQuery.toLowerCase().trim()
    return data.trendingPosts.filter((post) => {
      return (
        post.postText.toLowerCase().includes(query) ||
        post.source.toLowerCase().includes(query) ||
        post.category?.toLowerCase().includes(query) ||
        post.platform.toLowerCase().includes(query)
      )
    })
  }, [data?.trendingPosts, searchQuery])

  const filteredAllPosts = useMemo(() => {
    if (!data?.allPosts || !searchQuery.trim()) {
      return data?.allPosts || []
    }
    const query = searchQuery.toLowerCase().trim()
    return data.allPosts.filter((post) => {
      return (
        post.postText.toLowerCase().includes(query) ||
        post.source.toLowerCase().includes(query) ||
        post.category?.toLowerCase().includes(query) ||
        post.platform.toLowerCase().includes(query)
      )
    })
  }, [data?.allPosts, searchQuery])

  const filteredChartData = useMemo(() => {
    if (!data?.chartData || !searchQuery.trim()) {
      return data?.chartData
    }

    const query = searchQuery.toLowerCase().trim()

    return {
      ...data.chartData,
      newsFlow: data.chartData.newsFlow.filter((item) => item.category.toLowerCase().includes(query)),
      sourceEngagement: data.chartData.sourceEngagement.filter((item) => item.source.toLowerCase().includes(query)),
      categoryTrending: data.chartData.categoryTrending.filter((item) => item.category.toLowerCase().includes(query)),
      categoryReactions: data.chartData.categoryReactions.filter((item) => item.category.toLowerCase().includes(query)),
      sentimentDistribution: data.chartData.sentimentDistribution,
    }
  }, [data?.chartData, searchQuery])

  const filteredHighlightMetrics = useMemo(() => {
    if (!data?.highlightMetrics || !searchQuery.trim()) {
      return data?.highlightMetrics
    }

    const query = searchQuery.toLowerCase().trim()
    const defaultMetric = { value: 0, text: "No matching data", source: "N/A", postLink: null as string | null, fullText: "", sentiment: "neutral" }

    // Find matching posts for highlight metrics
    const matchingPosts = filteredPosts

    if (matchingPosts.length === 0) {
      return {
        mostLiked: defaultMetric,
        mostShared: defaultMetric,
        mostCommented: defaultMetric,
      }
    }

    // Recalculate metrics from filtered posts
    const mostLiked = matchingPosts.reduce((max, post) => (post.reactions > max.reactions ? post : max))
    const mostShared = matchingPosts.reduce((max, post) => (post.shares > max.shares ? post : max))
    const mostCommented = matchingPosts.reduce((max, post) => (post.comments > max.comments ? post : max))

    return {
      mostLiked: {
        value: mostLiked.reactions,
        text: mostLiked.postText.substring(0, 100) + "...",
        source: mostLiked.source,
        postLink: mostLiked.postLink,
        fullText: mostLiked.postText,
        sentiment: mostLiked.sentiment,
      },
      mostShared: {
        value: mostShared.shares,
        text: mostShared.postText.substring(0, 100) + "...",
        source: mostShared.source,
        postLink: mostShared.postLink,
        fullText: mostShared.postText,
        sentiment: mostShared.sentiment,
      },
      mostCommented: {
        value: mostCommented.comments,
        text: mostCommented.postText.substring(0, 100) + "...",
        source: mostCommented.source,
        postLink: mostCommented.postLink,
        fullText: mostCommented.postText,
        sentiment: mostCommented.sentiment,
      },
    }
  }, [data?.highlightMetrics, filteredPosts, searchQuery])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
        ...(filters.categories.length > 0 && { categories: filters.categories.join(",") }),
        ...(filters.sources.length > 0 && { sources: filters.sources.join(",") }),
        ...(filters.platforms.length > 0 && { platforms: filters.platforms.join(",") }),
      })

      const response = await fetch(`/api/dashboard?${params}`)
      if (!response.ok) throw new Error("Failed to fetch dashboard data")

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    try {
      // Trigger data ingestion
      await fetch("/api/ingest", { method: "POST" })
      // Refresh dashboard data
      await fetchDashboardData()
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [filters])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <DashboardHeader onManualRefresh={handleManualRefresh} onSearch={handleSearch} searchQuery={searchQuery} />

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={data?.filterOptions || { categories: [], sources: [], platforms: [] }}
        onRefresh={fetchDashboardData}
      />

      <main className="max-w-[1800px] mx-auto px-10 py-8 space-y-10">
        {data && (
          <>
            <HighlightCards metrics={filteredHighlightMetrics || data.highlightMetrics} />
            <TrendingPostsTable posts={filteredPosts} />
            <TrendingPostsTable posts={filteredAllPosts} title="All News Posts" />
            <ChartsSection chartData={filteredChartData || data.chartData} />

            {searchQuery.trim() && (
              <div className="text-center py-4">
                <p className="text-gray-400">
                  Showing {filteredPosts.length} results for "{searchQuery}"
                  {filteredPosts.length === 0 && (
                    <span className="block mt-2 text-sm">Try adjusting your search terms or clearing filters</span>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

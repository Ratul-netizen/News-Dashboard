"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { FilterBar } from "@/components/filter-bar"
import { HighlightCards } from "@/components/highlight-cards"
import { DynamicPostsTable } from "@/components/dynamic-posts-table"
import { AnalyticsFieldsPanel } from "@/components/analytics-fields-panel"
import { ChartsSection } from "@/components/charts-section"
import type { DashboardFilters, TrendingPost } from "@/lib/types"
import { ColumnConfig, ColumnConfigService } from "@/lib/services/column-config-service"
// Auth removed
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
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentColumns, setCurrentColumns] = useState<ColumnConfig[]>(
    ColumnConfigService.getDefaultConfiguration().columns
  )
  const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: dayjs().subtract(7, "days").toDate(),
      to: new Date(),
    },
    categories: [],
    sources: [],
    platforms: [],
  })

  // Auth disabled: no redirect

  const filteredPosts = useMemo(() => {
    if (!data?.trendingPosts) {
      return []
    }

    let filtered = data.trendingPosts

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((post) => {
        return (
          post.postText.toLowerCase().includes(query) ||
          post.source.toLowerCase().includes(query) ||
          post.category?.toLowerCase().includes(query) ||
          post.platform.toLowerCase().includes(query)
        )
      })
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((post) => 
        post.category && filters.categories.includes(post.category)
      )
    }

    // Apply source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter((post) => 
        filters.sources.includes(post.source)
      )
    }

    // Apply platform filter
    if (filters.platforms.length > 0) {
      filtered = filtered.filter((post) => 
        filters.platforms.includes(post.platform)
      )
    }

    // Apply date range filter
    if (filters.dateRange.from && filters.dateRange.to) {
      filtered = filtered.filter((post) => {
        const postDate = new Date(post.postDate)
        // Set time to start of day for from date and end of day for to date
        const fromDate = new Date(filters.dateRange.from)
        fromDate.setHours(0, 0, 0, 0)
        const toDate = new Date(filters.dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        return postDate >= fromDate && postDate <= toDate
      })
    }

    return filtered
  }, [data?.trendingPosts, searchQuery, filters])

  const filteredAllPosts = useMemo(() => {
    if (!data?.allPosts) {
      return []
    }

    let filtered = data.allPosts

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((post) => {
        return (
          post.postText.toLowerCase().includes(query) ||
          post.source.toLowerCase().includes(query) ||
          post.category?.toLowerCase().includes(query) ||
          post.platform.toLowerCase().includes(query)
        )
      })
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((post) => 
        post.category && filters.categories.includes(post.category)
      )
    }

    // Apply source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter((post) => 
        filters.sources.includes(post.source)
      )
    }

    // Apply platform filter
    if (filters.platforms.length > 0) {
      filtered = filtered.filter((post) => 
        filters.platforms.includes(post.platform)
      )
    }

    // Apply date range filter
    if (filters.dateRange.from && filters.dateRange.to) {
      filtered = filtered.filter((post) => {
        const postDate = new Date(post.postDate)
        // Set time to start of day for from date and end of day for to date
        const fromDate = new Date(filters.dateRange.from)
        fromDate.setHours(0, 0, 0, 0)
        const toDate = new Date(filters.dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        return postDate >= fromDate && postDate <= toDate
      })
    }

    return filtered
  }, [data?.allPosts, searchQuery, filters])

  const filteredChartData = useMemo(() => {
    if (!data?.chartData) {
      return data?.chartData
    }

    let filtered = { ...data.chartData }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = {
        ...filtered,
        newsFlow: filtered.newsFlow.filter((item) => item.category.toLowerCase().includes(query)),
        sourceEngagement: filtered.sourceEngagement.filter((item) => item.source.toLowerCase().includes(query)),
        categoryTrending: filtered.categoryTrending.filter((item) => item.category.toLowerCase().includes(query)),
        categoryReactions: filtered.categoryReactions.filter((item) => item.category.toLowerCase().includes(query)),
        sentimentDistribution: filtered.sentimentDistribution,
      }
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = {
        ...filtered,
        newsFlow: filtered.newsFlow.filter((item) => filters.categories.includes(item.category)),
        categoryTrending: filtered.categoryTrending.filter((item) => filters.categories.includes(item.category)),
        categoryReactions: filtered.categoryReactions.filter((item) => filters.categories.includes(item.category)),
      }
    }

    // Apply source filter
    if (filters.sources.length > 0) {
      filtered = {
        ...filtered,
        sourceEngagement: filtered.sourceEngagement.filter((item) => filters.sources.includes(item.source)),
      }
    }

    return filtered
  }, [data?.chartData, searchQuery, filters])

  const filteredHighlightMetrics = useMemo(() => {
    if (!data?.highlightMetrics) {
      return data?.highlightMetrics
    }

    const defaultMetric = { value: 0, text: "No matching data", source: "N/A", postLink: null as string | null, fullText: "", sentiment: "neutral" }

    // Use filtered posts for highlight metrics
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
  }, [data?.highlightMetrics, filteredPosts])

  const handleAddColumn = (columnId: string) => {
    const columnToAdd = ColumnConfigService.getColumnById(columnId)
    if (columnToAdd) {
      // Position new column after the Source column (position 4)
      const sourceColumnPosition = 4
      
      // Find the highest position among customizable columns that come after Source
      const maxPosition = Math.max(
        sourceColumnPosition,
        ...currentColumns
          .filter(col => !ColumnConfigService.isColumnFixed(col.id) && col.position > sourceColumnPosition)
          .map(col => col.position)
      )
      
      const newColumn = { ...columnToAdd, position: maxPosition + 1 }
      const newColumns = [...currentColumns, newColumn]
      
      // Sort by position
      newColumns.sort((a, b) => a.position - b.position)
      setCurrentColumns(newColumns)
    }
  }

  const handleRemoveColumn = (columnId: string) => {
    if (!ColumnConfigService.isColumnFixed(columnId)) {
      const newColumns = currentColumns.filter(col => col.id !== columnId)
      setCurrentColumns(newColumns)
    }
  }

  const handleReorderColumns = (columns: ColumnConfig[]) => {
    setCurrentColumns(columns)
  }

  const handleResetToDefault = () => {
    setCurrentColumns(ColumnConfigService.getDefaultConfiguration().columns)
  }

  const handleSaveConfiguration = (name: string) => {
    console.log('Saving configuration:', name, currentColumns)
    // This would typically save to a database
    alert(`Configuration "${name}" saved successfully!`)
  }

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

      const response = await fetch(`/api/dashboard?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (!response.ok) throw new Error("Failed to fetch dashboard data")

      const dashboardData = await response.json()
      setData(dashboardData)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    try {
      setIsIngesting(true)
      console.log('🔄 Starting manual data refresh...')
      
      // Trigger data ingestion
      const ingestResponse = await fetch("/api/ingest", { 
        method: "POST"
      })
      if (!ingestResponse.ok) {
        throw new Error(`Ingest failed: ${ingestResponse.statusText}`)
      }
      
      const ingestResult = await ingestResponse.json()
      console.log('✅ Data ingestion completed:', ingestResult)
      
      // Refresh dashboard data
      await fetchDashboardData()
      setLastRefresh(new Date())
      
      console.log('🎉 Manual refresh completed successfully!')
    } catch (error) {
      console.error("❌ Error refreshing data:", error)
      alert(`Failed to refresh data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsIngesting(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [filters])

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...')
      fetchDashboardData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Auth disabled: no auth loading state

  // Show loading while fetching data
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <DashboardHeader 
        onManualRefresh={handleManualRefresh} 
        onSearch={handleSearch} 
        searchQuery={searchQuery}
      />

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={data?.filterOptions || { categories: [], sources: [], platforms: [] }}
        onRefresh={handleManualRefresh}
        isRefreshing={isIngesting}
      />

      {/* Token status panel removed for end-users */}

      <main className="max-w-[1800px] mx-auto px-10 py-8 space-y-10">
        {data && (
          <>
            <HighlightCards metrics={filteredHighlightMetrics || data.highlightMetrics} />
            
            {/* Top 10 Viral Posts Table with Dynamic Columns */}
            <DynamicPostsTable
              title="Top 10 Viral Posts"
              posts={filteredPosts}
              currentColumns={currentColumns}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
              onReorderColumns={handleReorderColumns}
              showColumnManagement={true}
              postsPerPage={10}
            />
            
            {/* All News Posts Table with Dynamic Columns */}
            <DynamicPostsTable
              title="All News Posts"
              posts={filteredAllPosts}
              currentColumns={currentColumns}
              onAddColumn={handleAddColumn}
              onRemoveColumn={handleRemoveColumn}
              onReorderColumns={handleReorderColumns}
              showColumnManagement={false}
              postsPerPage={filteredAllPosts.length || 1000}
            />
            
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

      {/* Analytics Fields Panel */}
      <AnalyticsFieldsPanel
        currentColumns={currentColumns}
        onAddColumn={handleAddColumn}
        onRemoveColumn={handleRemoveColumn}
        onResetToDefault={handleResetToDefault}
        onSaveConfiguration={handleSaveConfiguration}
        isOpen={isAnalyticsPanelOpen}
        onToggle={() => setIsAnalyticsPanelOpen(!isAnalyticsPanelOpen)}
      />
    </div>
  )
}

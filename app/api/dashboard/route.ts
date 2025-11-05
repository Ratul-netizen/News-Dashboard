import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { prisma } from "@/lib/db"
import dayjs from "dayjs"
import type { DashboardFilters, TrendingPost, PostAnalysis } from "@/lib/types"
import { ContentScoringService } from "@/lib/services/scoring-service"

export async function GET(request: NextRequest) {
  try {
    // Check if database is accessible
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error("[v0] Database connection failed:", dbError)
      return NextResponse.json({ 
        error: "Database not ready. Please wait for initialization to complete.",
        status: "initializing"
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)

    // Parse filters from query parameters
    const filters: DashboardFilters = {
      dateRange: {
        from: searchParams.get("from") ? new Date(searchParams.get("from")!) : dayjs().subtract(365, "days").toDate(), // Show last year by default
        to: searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(),
      },
      categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
      sources: searchParams.get("sources")?.split(",").filter(Boolean) || [],
      platforms: searchParams.get("platforms")?.split(",").filter(Boolean) || [],
    }

    console.log("[v0] Fetching dashboard data with filters:", filters)

    // Build where clause for filtering
    // Include any news item whose time window overlaps the selected range
    // Handle cases where lastPostDate may be null by falling back to firstPostDate
    // Overlapping window: firstPostDate <= to AND lastPostDate >= from
    // Note: lastPostDate is non-nullable in schema, so no null checks
    const whereClause: any = {
      firstPostDate: { lte: filters.dateRange.to },
      lastPostDate: { gte: filters.dateRange.from },
    }

    if (filters.categories.length > 0) {
      whereClause.category = { in: filters.categories }
    }

    if (filters.sources.length > 0) {
      whereClause.primarySource = { in: filters.sources }
    }

    if (filters.platforms.length > 0) {
      whereClause.primaryPlatform = { in: filters.platforms }
    }

    // Fetch trending posts (top 10 by trending score)
    const trendingPosts = await prisma.newsItem.findMany({
      where: whereClause,
      orderBy: { avgTrendingScore: "desc" },
      take: 10,
      include: {
        posts: {
          take: 1,
          orderBy: { trendingScore: "desc" },
        },
      },
    })

    // Fetch all posts (same shape, no top-10 limit)
    const allNewsItems = await prisma.newsItem.findMany({
      where: whereClause,
      orderBy: { avgTrendingScore: "desc" },
      include: {
        posts: {
          take: 1,
          orderBy: { trendingScore: "desc" },
        },
      },
    })

    // Initialize scoring service
    const scoringService = new ContentScoringService()
    
    // Calculate max trending score for scaling
    const maxTrendingScore = allNewsItems.length > 0 
      ? Math.max(...allNewsItems.map(r => r.avgTrendingScore || 0))
      : 1

    // Helper function to format posts with advanced scoring
    const formatPostWithScoring = (item: any): TrendingPost => {
      const primaryPost = item.posts[0]
      const postAnalysis: PostAnalysis | null = item.postAnalysisJson ? JSON.parse(item.postAnalysisJson) : null

      // Calculate days difference from post date
      const daysDifference = scoringService.calculateDaysDifference(item.firstPostDate)
      
      // Calculate virality score from post analysis
      const viralityScore = postAnalysis 
        ? scoringService.calculateViralityScore(JSON.stringify(postAnalysis))
        : 1

      // Calculate source weight (using estimated values for missing data)
      const estimatedFollowers = 1000 // Default value - you may want to add this to your database
      const estimatedPostsPerDay = scoringService.calculatePostsPerDay(
        item.sourceCount || 1,
        item.firstPostDate,
        item.lastPostDate || item.firstPostDate
      )
      
      const sourceWeight = scoringService.calculateSourceWeight(
        item.totalReactions || 0,
        estimatedFollowers,
        estimatedPostsPerDay
      )

      // Calculate news flow weight
      const { totalPostWeight, totalPostWeightByCategory } = scoringService.calculateNewsFlowWeight(
        item.totalReactions || 0,
        item.totalShares || 0,
        item.totalComments || 0,
        daysDifference,
        item.category || 'Other'
      )

      // Calculate final trending score
      const finalTrendingScore = scoringService.calculateFinalTrendingScore(
        sourceWeight,
        totalPostWeightByCategory,
        scoringService.getCategoryWeight(item.category || 'Other'),
        viralityScore,
        maxTrendingScore
      )

      return {
        id: item.id,
        postText: primaryPost?.postText || "",
        category: item.category,
        source: item.primarySource,
        platform: item.primaryPlatform,
        reactions: item.totalReactions,
        shares: item.totalShares,
        comments: item.totalComments,
        sourceCount: item.sourceCount,
        postDate: item.firstPostDate,
        postLink: primaryPost?.postLink || null,
        postAnalysis,
        trendingScore: item.avgTrendingScore,
        // New scoring fields
        sourceWeight,
        newsFlowWeight: totalPostWeight,
        newsFlowWeightByCategory: totalPostWeightByCategory,
        viralityScore,
        finalTrendingScore,
        sentiment: primaryPost?.sentiment || "neutral",
      }
    }

    // Transform to TrendingPost format with advanced scoring
    const formattedTrendingPosts: TrendingPost[] = trendingPosts.map(formatPostWithScoring)

    // Transform all to TrendingPost format with advanced scoring
    const formattedAllPosts: TrendingPost[] = allNewsItems.map(formatPostWithScoring)

    // Get highlight metrics
    const highlightMetrics = await getHighlightMetrics(whereClause)

    // Get chart data
    const chartData = await getChartData(whereClause)

    // Get filter options
    const filterOptions = await getFilterOptions()

    return NextResponse.json({
      trendingPosts: formattedTrendingPosts,
      allPosts: formattedAllPosts,
      highlightMetrics,
      chartData,
      filterOptions,
    })
  } catch (error) {
    console.error("[v0] Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}

async function getHighlightMetrics(whereClause: any) {
  // Most liked post
  const mostLiked = await prisma.newsItem.findFirst({
    where: whereClause,
    orderBy: { totalReactions: "desc" },
    include: { posts: { take: 1, orderBy: { reactions: "desc" } } },
  })

  // Most shared post
  const mostShared = await prisma.newsItem.findFirst({
    where: whereClause,
    orderBy: { totalShares: "desc" },
    include: { posts: { take: 1, orderBy: { shares: "desc" } } },
  })

  // Most commented post
  const mostCommented = await prisma.newsItem.findFirst({
    where: whereClause,
    orderBy: { totalComments: "desc" },
    include: { posts: { take: 1, orderBy: { comments: "desc" } } },
  })

  return {
    mostLiked: {
      value: mostLiked?.totalReactions || 0,
      text: mostLiked?.posts[0]?.postText?.substring(0, 100) + "..." || "No data",
      source: mostLiked?.primarySource || "Unknown",
      postLink: mostLiked?.posts[0]?.postLink || null,
      fullText: mostLiked?.posts[0]?.postText || "No data",
      sentiment: mostLiked?.posts[0]?.sentiment || "neutral",
    },
    mostShared: {
      value: mostShared?.totalShares || 0,
      text: mostShared?.posts[0]?.postText?.substring(0, 100) + "..." || "No data",
      source: mostShared?.primarySource || "Unknown",
      postLink: mostShared?.posts[0]?.postLink || null,
      fullText: mostShared?.posts[0]?.postText || "No data",
      sentiment: mostShared?.posts[0]?.sentiment || "neutral",
    },
    mostCommented: {
      value: mostCommented?.totalComments || 0,
      text: mostCommented?.posts[0]?.postText?.substring(0, 100) + "..." || "No data",
      source: mostCommented?.primarySource || "Unknown",
      postLink: mostCommented?.posts[0]?.postLink || null,
      fullText: mostCommented?.posts[0]?.postText || "No data",
      sentiment: mostCommented?.posts[0]?.sentiment || "neutral",
    },
  }
}

async function getChartData(whereClause: any) {
  // News flow by category (pie chart data)
  const categoryStats = await prisma.newsItem.groupBy({
    by: ["category"],
    where: whereClause,
    _count: { id: true },
    _sum: {
      totalReactions: true,
      totalShares: true,
      totalComments: true,
    },
  })

  const newsFlowData = categoryStats.map((stat) => ({
    category: stat.category || "Uncategorized",
    count: stat._count.id,
    reactions: stat._sum.totalReactions || 0,
    shares: stat._sum.totalShares || 0,
    comments: stat._sum.totalComments || 0,
  }))

  // Get sentiment distribution
  const sentimentStats = await prisma.post.groupBy({
    by: ["sentiment"],
    where: { sentiment: { not: null } },
    _count: { id: true },
  })

  const sentimentData = sentimentStats.map((stat) => ({
    sentiment: stat.sentiment || "neutral",
    count: stat._count.id,
  }))

  // Top sources engagement (bar chart data)
  const sourceStats = await prisma.newsItem.groupBy({
    by: ["primarySource"],
    where: whereClause,
    _sum: {
      totalReactions: true,
      totalShares: true,
      totalComments: true,
    },
    orderBy: {
      _sum: {
        totalReactions: "desc",
      },
    },
    take: 12,
  })

  const sourceEngagementData = sourceStats.map((stat) => ({
    source: stat.primarySource,
    reactions: stat._sum.totalReactions || 0,
    shares: stat._sum.totalShares || 0,
    comments: stat._sum.totalComments || 0,
  }))

  return {
    newsFlow: newsFlowData,
    sourceEngagement: sourceEngagementData,
    categoryTrending: newsFlowData.map((item) => ({
      category: item.category,
      posts: item.count,
    })),
    categoryReactions: newsFlowData.map((item) => ({
      category: item.category,
      reactions: item.reactions,
    })),
    sentimentDistribution: sentimentData,
  }
}

async function getFilterOptions() {
  // Get unique categories
  const categories = await prisma.newsItem.findMany({
    select: { category: true },
    distinct: ["category"],
    where: { category: { not: null } },
  })

  // Get unique sources
  const sources = await prisma.newsItem.findMany({
    select: { primarySource: true },
    distinct: ["primarySource"],
  })

  // Get unique platforms
  const platforms = await prisma.newsItem.findMany({
    select: { primaryPlatform: true },
    distinct: ["primaryPlatform"],
  })

  return {
    categories: categories.map((c) => c.category).filter(Boolean),
    sources: sources.map((s) => s.primarySource),
    platforms: platforms.map((p) => p.primaryPlatform),
  }
}

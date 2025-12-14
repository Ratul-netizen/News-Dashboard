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
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    // Use a very wide default date range (20 years) to include all posts by default
    const defaultFromDate = dayjs().subtract(20, "years").toDate()

    const filters: DashboardFilters = {
      dateRange: {
        from: fromParam ? new Date(fromParam) : defaultFromDate,
        to: toParam ? new Date(toParam) : new Date(),
      },
      categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
      sources: searchParams.get("sources")?.split(",").filter(Boolean) || [],
      platforms: searchParams.get("platforms")?.split(",").filter(Boolean) || [],
    }

    console.log("[v0] Fetching dashboard data with filters:", filters)
    console.log(`[v0] Date range: ${filters.dateRange.from.toISOString()} to ${filters.dateRange.to.toISOString()}`)

    // First, get total count without date filter to see how many items exist
    const totalCount = await prisma.newsItem.count({})
    console.log(`[v0] Total news items in database: ${totalCount}`)

    // Build where clause for filtering
    // NOTE: Date filter removed - API returns ALL posts regardless of date
    // Frontend can filter by date if needed, but API should return everything
    const whereClause: any = {}

    // Date filtering disabled - return all posts
    // Uncomment below if you want to re-enable date filtering:
    // if (fromParam || toParam) {
    //   whereClause.firstPostDate = { lte: filters.dateRange.to }
    //   whereClause.lastPostDate = { gte: filters.dateRange.from }
    // }

    console.log(`[v0] Date filter DISABLED - returning all posts regardless of date`)

    const countWithFilter = await prisma.newsItem.count({ where: whereClause })
    console.log(`[v0] News items matching filters (excluding date): ${countWithFilter}`)

    if (filters.categories.length > 0) {
      whereClause.category = { in: filters.categories }
    }

    if (filters.sources.length > 0) {
      whereClause.primarySource = { in: filters.sources }
    }

    if (filters.platforms.length > 0) {
      whereClause.primaryPlatform = { in: filters.platforms }
    }

    // Build where clause for posts (slightly different field names)
    const whereClausePosts: any = {}

    if (filters.categories.length > 0) {
      whereClausePosts.category = { in: filters.categories }
    }

    if (filters.sources.length > 0) {
      whereClausePosts.source = { in: filters.sources }
    }

    if (filters.platforms.length > 0) {
      whereClausePosts.platform = { in: filters.platforms }
    }

    // Fetch trending posts (top 10 by trending score) - KEEPS GROUPING
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

    // Fetch all posts - SHOWS INDIVIDUAL POSTS (UNGROUPED)
    const allRawPosts = await prisma.post.findMany({
      where: whereClausePosts,
      orderBy: { postDate: "desc" },
      take: 1000, // Limit to 1000 most recent posts
    })

    console.log(`[v0] Fetched ${allRawPosts.length} raw posts from database`)

    // Initialize scoring service
    const scoringService = new ContentScoringService()

    // Calculate max trending score for scaling
    const maxTrendingScore = trendingPosts.length > 0
      ? Math.max(...trendingPosts.map((item: typeof trendingPosts[number]) => item.avgTrendingScore || 0))
      : 1

    // Helper function to format grouped news items
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
      const estimatedFollowers = 1000 // Default value
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
        type: "news-item",
      }
    }

    // Helper function to format raw posts
    const formatRawPost = (post: any): TrendingPost => {
      return {
        id: post.id, // Use post ID directly
        postText: post.postText || "",
        category: post.category,
        source: post.source,
        platform: post.platform,
        reactions: post.reactions,
        shares: post.shares,
        comments: post.comments,
        sourceCount: 1, // Single post = 1 source
        postDate: post.postDate,
        postLink: post.postLink || null,
        postAnalysis: null,
        trendingScore: post.trendingScore,
        // Default scoring fields for raw posts
        sourceWeight: 0,
        newsFlowWeight: 0,
        newsFlowWeightByCategory: 0,
        viralityScore: 0,
        finalTrendingScore: post.trendingScore,
        sentiment: post.sentiment || "neutral",
        type: "raw-post",
      }
    }

    // Transform to TrendingPost format
    const formattedTrendingPosts: TrendingPost[] = trendingPosts.map(formatPostWithScoring)

    // Transform raw posts to TrendingPost format
    const formattedAllPosts: TrendingPost[] = allRawPosts.map(formatRawPost)

    console.log(`[v0] Returning ${formattedAllPosts.length} formatted posts to frontend`)

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
  type CategoryStat = {
    category: string | null
    _count: { id: number }
    _sum: {
      totalReactions: number | null
      totalShares: number | null
      totalComments: number | null
    }
  }
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

  type NewsFlowDatum = {
    category: string
    count: number
    reactions: number
    shares: number
    comments: number
  }

  const newsFlowData: NewsFlowDatum[] = categoryStats.map((stat: CategoryStat) => ({
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

  type SentimentStat = {
    sentiment: string | null
    _count: { id: number }
  }

  const sentimentData = sentimentStats.map((stat: SentimentStat) => ({
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

  type SourceStat = {
    primarySource: string | null
    _sum: {
      totalReactions: number | null
      totalShares: number | null
      totalComments: number | null
    }
  }

  const sourceEngagementData = sourceStats.map((stat: SourceStat) => ({
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
  type CategoryRecord = { category: string | null }
  const categories: CategoryRecord[] = await prisma.newsItem.findMany({
    select: { category: true },
    distinct: ["category"],
    where: { category: { not: null } },
  })

  // Get unique sources
  type SourceRecord = { primarySource: string | null }
  const sources: SourceRecord[] = await prisma.newsItem.findMany({
    select: { primarySource: true },
    distinct: ["primarySource"],
  })

  // Get unique platforms
  type PlatformRecord = { primaryPlatform: string | null }
  const platforms: PlatformRecord[] = await prisma.newsItem.findMany({
    select: { primaryPlatform: true },
    distinct: ["primaryPlatform"],
  })

  return {
    categories: categories.map((c) => c.category).filter(Boolean),
    sources: sources.map((s) => s.primarySource),
    platforms: platforms.map((p) => p.primaryPlatform),
  }
}

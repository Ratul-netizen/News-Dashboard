import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { prisma } from "@/lib/db"
import dayjs from "dayjs"
import type { DashboardFilters, TrendingPost, PostAnalysis } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters from query parameters
    const filters: DashboardFilters = {
      dateRange: {
        from: searchParams.get("from") ? new Date(searchParams.get("from")!) : dayjs().subtract(7, "days").toDate(),
        to: searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(),
      },
      categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
      sources: searchParams.get("sources")?.split(",").filter(Boolean) || [],
      platforms: searchParams.get("platforms")?.split(",").filter(Boolean) || [],
    }

    console.log("[v0] Fetching dashboard data with filters:", filters)

    // Build where clause for filtering
    // Include any news item whose time window overlaps the selected range
    // i.e., firstPostDate <= to AND lastPostDate >= from
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

    // Transform to TrendingPost format
    const formattedTrendingPosts: TrendingPost[] = trendingPosts.map((item) => {
      const primaryPost = item.posts[0]
      const postAnalysis: PostAnalysis | null = item.postAnalysisJson ? JSON.parse(item.postAnalysisJson) : null

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
        sentiment: primaryPost?.sentiment || "neutral",
      }
    })

    // Transform all to TrendingPost format
    const formattedAllPosts: TrendingPost[] = allNewsItems.map((item) => {
      const primaryPost = item.posts[0]
      const postAnalysis: PostAnalysis | null = item.postAnalysisJson ? JSON.parse(item.postAnalysisJson) : null

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
        sentiment: primaryPost?.sentiment || "neutral",
      }
    })

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

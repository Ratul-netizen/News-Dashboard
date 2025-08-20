import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import type { TrendingPost, PostAnalysis } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 })
    }

    console.log(`[v0] Searching for: "${query}"`)

    // Search in news items and posts
    const searchResults = await prisma.newsItem.findMany({
      where: {
        OR: [
          {
            posts: {
              some: {
                OR: [
                  { postText: { contains: query } },
                  { source: { contains: query } },
                  { category: { contains: query } },
                  { platform: { contains: query } },
                ],
              },
            },
          },
          { category: { contains: query } },
          { primarySource: { contains: query } },
          { primaryPlatform: { contains: query } },
        ],
      },
      include: {
        posts: {
          take: 1,
          orderBy: { trendingScore: "desc" },
        },
      },
      orderBy: { avgTrendingScore: "desc" },
      take: limit,
    })

    // Transform to TrendingPost format
    const formattedResults: TrendingPost[] = searchResults.map((item) => {
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
        sentiment: "neutral", // Default sentiment for search results
      }
    })

    // Get search suggestions (related terms)
    const suggestions = await getSearchSuggestions(query)

    return NextResponse.json({
      results: formattedResults,
      totalResults: formattedResults.length,
      query,
      suggestions,
    })
  } catch (error) {
    console.error("[v0] Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    // Get related categories
    const categories = await prisma.newsItem.findMany({
      where: {
        category: {
          contains: query,
        },
      },
      select: { category: true },
      distinct: ["category"],
      take: 5,
    })

    // Get related sources
    const sources = await prisma.newsItem.findMany({
      where: {
        primarySource: {
          contains: query,
        },
      },
      select: { primarySource: true },
      distinct: ["primarySource"],
      take: 5,
    })

    const suggestions = [
      ...categories.map((c) => c.category).filter((c): c is string => c !== null),
      ...sources.map((s) => s.primarySource).filter((s): s is string => s !== null)
    ]

    return [...new Set(suggestions)].slice(0, 8)
  } catch (error) {
    console.error("[v0] Error getting search suggestions:", error)
    return []
  }
}

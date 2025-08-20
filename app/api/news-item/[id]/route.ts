import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import type { PostAnalysis } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const newsItem = await prisma.newsItem.findUnique({
      where: { id: params.id },
      include: {
        posts: {
          orderBy: { postDate: "desc" },
        },
      },
    })

    if (!newsItem) {
      return NextResponse.json({ error: "News item not found" }, { status: 404 })
    }

    // If no posts are linked, try to find posts by matching the group key pattern
    let posts = newsItem.posts
    if (posts.length === 0) {
      console.log(`[v0] No posts linked to news item ${params.id}, searching by group key pattern...`)
      
      // Extract source and category from group key
      const groupKeyParts = newsItem.groupKey.split('_')
      const source = groupKeyParts[0]
      const category = groupKeyParts[1] === 'null' ? null : groupKeyParts[1]
      const dateStr = groupKeyParts[2]
      
      console.log(`[v0] Searching for posts with source: ${source}, category: ${category}, date: ${dateStr}`)
      
      // Find posts that match the group key pattern
      posts = await prisma.post.findMany({
        where: {
          source: source,
          category: category,
          postDate: {
            gte: new Date(dateStr + 'T00:00:00Z'),
            lt: new Date(new Date(dateStr + 'T00:00:00Z').getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { postDate: "desc" },
      })
      
      console.log(`[v0] Found ${posts.length} posts matching group key pattern`)
    }

    if (!newsItem) {
      return NextResponse.json({ error: "News item not found" }, { status: 404 })
    }

    // Parse post analysis
    const postAnalysis: PostAnalysis | null = newsItem.postAnalysisJson ? JSON.parse(newsItem.postAnalysisJson) : null

    // Calculate daily engagement for chart
    const dailyEngagement = calculateDailyEngagement(posts)

    return NextResponse.json({
      newsItem: {
        ...newsItem,
        postAnalysis,
      },
      posts: posts,
      dailyEngagement,
    })
  } catch (error) {
    console.error("[v0] News item API error:", error)
    return NextResponse.json({ error: "Failed to fetch news item" }, { status: 500 })
  }
}

function calculateDailyEngagement(posts: any[]) {
  const dailyData = posts.reduce(
    (acc, post) => {
      const date = post.postDate.toISOString().split("T")[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          reactions: 0,
          shares: 0,
          comments: 0,
          posts: 0,
        }
      }

      acc[date].reactions += post.reactions
      acc[date].shares += post.shares
      acc[date].comments += post.comments
      acc[date].posts += 1

      return acc
    },
    {} as Record<string, any>,
  )

  return Object.values(dailyData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

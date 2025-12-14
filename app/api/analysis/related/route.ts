
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Post } from "@prisma/client"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get("postId")

    if (!postId) {
        return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    try {
        // 1. Get the original post
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { newsItem: true }
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // 2. If it belongs to a NewsItem, return that group's data (Best Cross-Platform view)
        if (post.newsItem) {
            const newsItem = await prisma.newsItem.findUnique({
                where: { id: post.newsItem.id },
                include: { posts: { orderBy: { postDate: 'desc' } } }
            })

            if (newsItem) {
                return NextResponse.json({
                    type: 'group',
                    newsItem: {
                        ...newsItem,
                        postAnalysis: newsItem.postAnalysisJson ? JSON.parse(newsItem.postAnalysisJson) : null
                    },
                    posts: newsItem.posts,
                    relatedNews: [] // To be populated later
                })
            }
        }

        // 3. If no NewsItem, perform similarity search to find "Related Posts" (Cross-Platform Context)
        // Basic strategy: Match posts with same words in `postText` (simplified) or same Category + close Date

        const keywords = extractKeywords(post.postText)
        const startDate = new Date(post.postDate)
        startDate.setDate(startDate.getDate() - 1)
        const endDate = new Date(post.postDate)
        endDate.setDate(endDate.getDate() + 1)

        // Find similar posts (fallback grouping)
        const similarPosts = await prisma.post.findMany({
            where: {
                id: { not: post.id }, // Exclude self
                postDate: { gte: startDate, lte: endDate },
                OR: [
                    { category: post.category }, // Same category
                    // In a real app with Postgres, we'd use full-text search here. 
                    // For now, we rely on category and time, and maybe basic text filtering in memory if excessive
                ]
            },
            orderBy: { reactions: 'desc' },
            take: 50
        })

        // Filter by text similarity in memory (simple inclusion)
        const trulySimilarPosts = similarPosts.filter(p => {
            // 1. Length ratio check: prevent matching if sizes differ drastically (> 50%)
            const len1 = post.postText.length
            const len2 = p.postText.length
            const ratio = len1 > len2 ? len2 / len1 : len1 / len2
            if (ratio < 0.5) return false

            // 2. Strict Dice Coefficient Threshold (0.45)
            // Debug tests showed 0.21 for dissimilar, 0.84 for similar.
            // 0.45 is a safe middle ground.
            return calculateJaccardSimilarity(post.postText, p.postText) > 0.45
        })

        // Construct a "Virtual Group"
        const allPosts = [post, ...trulySimilarPosts]

        // 4. Find "Related News" (Other distinct stories in same category)
        // This is valid for both Grouped and Single scenarios
        const relatedNewsItems = await prisma.newsItem.findMany({
            where: {
                category: post.category,
                id: post.newsItem?.id ? { not: post.newsItem.id } : undefined,
                lastPostDate: { gte: startDate }
            },
            orderBy: { totalReactions: 'desc' },
            take: 5
        })

        return NextResponse.json({
            type: 'virtual-group',
            mainPost: post,
            similarPosts: allPosts, // "Cross-platform coverage"
            relatedNews: relatedNewsItems
        })

    } catch (error) {
        console.error("Error in related analysis:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// Helper: Extract valid keywords (naïve)
function extractKeywords(text: string): string[] {
    if (!text) return []
    return text.toLowerCase().split(/\s+/)
        .filter(w => w.length > 4) // Filter short words
        .filter(w => !['about', 'after', 'before', 'their', 'where', 'which', 'would', 'could'].includes(w))
        .slice(0, 10)
}

import { calculateJaccardSimilarity } from "@/lib/utils/text-similarity"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateJaccardSimilarity } from '@/lib/utils/text-similarity'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    // Get the target post
    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!targetPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get all posts from the same category and similar time period
    const similarPosts = await prisma.post.findMany({
      where: {
        id: { not: postId }, // Exclude the target post
        category: targetPost.category,
        postDate: {
          gte: new Date(targetPost.postDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
          lte: new Date(targetPost.postDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
        },
      },
      take: 50, // Limit results
      orderBy: { trendingScore: 'desc' },
    })

    // Calculate similarity scores and filter
    const relatedPosts = similarPosts
      .map(post => ({
        ...post,
        similarity: calculateJaccardSimilarity(targetPost.postText, post.postText),
      }))
      .filter(post => post.similarity >= 0.2) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10) // Top 10 most similar

    // Get unique sources and platforms from related posts
    const sources = [...new Set(relatedPosts.map(post => post.source))]
    const platforms = [...new Set(relatedPosts.map(post => post.platform))]

    return NextResponse.json({
      success: true,
      data: {
        relatedPosts,
        sources,
        platforms,
        totalFound: relatedPosts.length,
      },
    })
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related posts' },
      { status: 500 }
    )
  }
}

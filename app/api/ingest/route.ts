import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { prisma } from "../../../lib/db"

const API_URL = "http://192.168.100.35:9051/api/posts/"

// Transform external API post format to internal format
function transformExternalPost(externalPost: any) {
  // Handle reactions - could be object with Total or direct number
  let reactions = 0;
  if (typeof externalPost.reactions === 'object' && externalPost.reactions !== null) {
    reactions = externalPost.reactions.Total || 0;
  } else if (typeof externalPost.reactions === 'number') {
    reactions = externalPost.reactions;
  }

  // Handle shares - could be total_shares or shares
  let shares = 0;
  if (externalPost.total_shares !== undefined) {
    shares = externalPost.total_shares;
  } else if (externalPost.shares !== undefined) {
    shares = externalPost.shares;
  }

  // Handle comments - could be total_comments or comments
  let comments = 0;
  if (externalPost.total_comments !== undefined) {
    comments = externalPost.total_comments;
  } else if (externalPost.comments !== undefined) {
    comments = externalPost.comments;
  }

  // Handle category - could be topic array or direct category
  let category = null;
  if (Array.isArray(externalPost.topic) && externalPost.topic.length > 0) {
    category = externalPost.topic[0];
  } else if (externalPost.category) {
    category = externalPost.category;
  }

  // Handle post date - could be posted_at or post_date
  let postDate = new Date();
  if (externalPost.posted_at) {
    postDate = new Date(externalPost.posted_at);
  } else if (externalPost.post_date) {
    postDate = new Date(externalPost.post_date);
  }

  // Handle post link - could be post_url or post_link
  let postLink = null;
  if (externalPost.post_url) {
    postLink = externalPost.post_url;
  } else if (externalPost.post_link) {
    postLink = externalPost.post_link;
  }

  // Handle featured images - convert array to string or null
  let featuredImages = null;
  if (Array.isArray(externalPost.featured_images_path) && externalPost.featured_images_path.length > 0) {
    featuredImages = externalPost.featured_images_path.join(',');
  }

  // Handle sentiment - normalize to lowercase
  let sentiment = "neutral";
  if (externalPost.sentiment) {
    sentiment = externalPost.sentiment.toLowerCase();
  }

  return {
    post_id: externalPost.post_id || externalPost.id || String(Math.random()),
    post_text: externalPost.post_text || "",
    post_date: postDate,
    post_link: postLink,
    platform: externalPost.platform || "F",
    source: externalPost.source || "Unknown",
    category: category,
    reactions: reactions,
    shares: shares,
    comments: comments,
    sentiment: sentiment,
    featured_images_path: featuredImages,
  }
}

// Calculate trending score
function calculateTrendingScore(reactions: number, shares: number, comments: number, postDate: Date): number {
  // Weight different engagement types
  const engagementScore = reactions * 1 + shares * 2 + comments * 3

  // Apply time decay (newer posts get higher scores)
  const hoursOld = (Date.now() - postDate.getTime()) / (1000 * 60 * 60)
  const timeDecay = Math.exp(-hoursOld / 24) // Decay over 24 hours

  return engagementScore * timeDecay
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting data ingestion process...")

    let allPosts: any[] = []
    let currentPage = 1
    const pageSize = 200 // Maximum page size
    let hasMorePages = true

    // Fetch all pages of data
    while (hasMorePages) {
      try {
        console.log(`[v0] Fetching page ${currentPage}...`)
        
        const response = await axios.get(`${API_URL}?page=${currentPage}&page_size=${pageSize}`, {
      timeout: 30000, // 30 second timeout
    })

        const data = response.data
        
        if (!data.result || !Array.isArray(data.result)) {
          console.error(`[v0] Invalid response structure on page ${currentPage}:`, data)
          break
        }

        allPosts = allPosts.concat(data.result)
        console.log(`[v0] Fetched ${data.result.length} posts from page ${currentPage}`)

        // Check if there are more pages
        if (data.next && data.current_page < data.total_pages) {
          currentPage++
        } else {
          hasMorePages = false
        }

        // Add a small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`[v0] Error fetching page ${currentPage}:`, error)
        break
      }
    }

    console.log(`[v0] Total posts fetched: ${allPosts.length}`)

    // Transform external API format to internal format
    const transformedPosts = allPosts.map(transformExternalPost)
    
    // Debug: Log a few transformed posts to see the structure
    console.log("[v0] Sample transformed post:", JSON.stringify(transformedPosts[0], null, 2))

    let postsProcessed = 0
    let newsItemsCreated = 0
    let newsItemsUpdated = 0

    // Process each post
    for (const apiPost of transformedPosts) {
      try {
        console.log(`[v0] Processing post: ${apiPost.post_id} - ${apiPost.post_text.substring(0, 50)}...`)
        
        // Validate required fields
        if (!apiPost.post_id || !apiPost.post_text) {
          console.log(`[v0] Skipping post with missing required fields: post_id=${apiPost.post_id}, post_text=${apiPost.post_text ? 'present' : 'missing'}`)
          continue
        }

        // Check if post already exists
        const existingPost = await prisma.post.findUnique({
          where: { postId: apiPost.post_id },
        })

        if (existingPost) {
          console.log(`[v0] Updating existing post: ${apiPost.post_id}`)
          // Update existing post
          await prisma.post.update({
            where: { postId: apiPost.post_id },
            data: {
              postText: apiPost.post_text,
              postDate: apiPost.post_date,
              postLink: apiPost.post_link,
              platform: apiPost.platform,
              source: apiPost.source,
              category: apiPost.category,
              reactions: apiPost.reactions,
              shares: apiPost.shares,
              comments: apiPost.comments,
              sentiment: apiPost.sentiment,
              featuredImagesPath: apiPost.featured_images_path,
              trendingScore: calculateTrendingScore(apiPost.reactions, apiPost.shares, apiPost.comments, apiPost.post_date),
            },
          })
        } else {
          console.log(`[v0] Creating new post: ${apiPost.post_id}`)
          // Create new post
          await prisma.post.create({
            data: {
              postId: apiPost.post_id,
              postText: apiPost.post_text,
              postDate: apiPost.post_date,
              postLink: apiPost.post_link,
              platform: apiPost.platform,
              source: apiPost.source,
              category: apiPost.category,
              reactions: apiPost.reactions,
              shares: apiPost.shares,
              comments: apiPost.comments,
              sentiment: apiPost.sentiment,
              featuredImagesPath: apiPost.featured_images_path,
              trendingScore: calculateTrendingScore(apiPost.reactions, apiPost.shares, apiPost.comments, apiPost.post_date),
              baseKey: apiPost.post_text.substring(0, 100), // Simple base key
              groupKey: `${apiPost.source}_${apiPost.category || 'uncategorized'}_${apiPost.post_date.toISOString().split('T')[0]}`, // Group by source + category + date
            },
          })
        }

        postsProcessed++
        console.log(`[v0] Successfully processed post ${postsProcessed}/${transformedPosts.length}`)
      } catch (error) {
        console.error(`[v0] Error processing post ${apiPost.post_id}:`, error)
        console.error(`[v0] Post data:`, JSON.stringify(apiPost, null, 2))
        
        // Check if it's a unique constraint error
        if (error instanceof Error && error.message && error.message.includes('Unique constraint')) {
          console.error(`[v0] Unique constraint violation for post ${apiPost.post_id}`)
        }
      }
    }

    // Create news items from posts
    console.log("[v0] Creating news items...")
    
    // Group posts by source and category
    const postsByGroup = await prisma.post.groupBy({
      by: ['source', 'category'],
      _count: { id: true },
      _sum: {
        reactions: true,
        shares: true,
        comments: true,
        trendingScore: true,
      },
      _min: { postDate: true },
      _max: { postDate: true },
    })

    for (const group of postsByGroup) {
      try {
        const posts = await prisma.post.findMany({
          where: {
            source: group.source,
            category: group.category,
          },
          orderBy: { trendingScore: 'desc' },
        })

        if (posts.length === 0) continue

        const totalReactions = group._sum.reactions || 0
        const totalShares = group._sum.shares || 0
        const totalComments = group._sum.comments || 0
        const avgTrendingScore = (group._sum.trendingScore || 0) / group._count.id
        const firstPostDate = group._min.postDate || new Date()
        const lastPostDate = group._max.postDate || new Date()

        const groupKey = `${group.source}_${group.category || 'uncategorized'}_${firstPostDate.toISOString().split('T')[0]}`

        // Create or update news item
        const newsItem = await prisma.newsItem.upsert({
          where: {
            groupKey: groupKey,
          },
          create: {
            groupKey: groupKey,
            category: group.category || 'uncategorized',
            primarySource: group.source,
            primaryPlatform: posts[0].platform,
            totalReactions,
            totalShares,
            totalComments,
            sourceCount: 1,
            platformCount: 1,
            postCount: group._count.id,
            avgTrendingScore,
            firstPostDate,
            lastPostDate,
            postAnalysisJson: JSON.stringify({
              sources: [group.source],
              platforms: [posts[0].platform],
              sampleTexts: posts.slice(0, 3).map(p => p.postText),
              postLinks: posts.map(p => p.postLink).filter(Boolean),
              totalEngagement: totalReactions + totalShares + totalComments,
              sentimentBreakdown: {
                positive: posts.filter(p => p.sentiment === "positive").length,
                neutral: posts.filter(p => p.sentiment === "neutral").length,
                negative: posts.filter(p => p.sentiment === "negative").length,
              },
            }),
          },
          update: {
            totalReactions,
            totalShares,
            totalComments,
            postCount: group._count.id,
            avgTrendingScore,
            lastPostDate,
            postAnalysisJson: JSON.stringify({
              sources: [group.source],
              platforms: [posts[0].platform],
              sampleTexts: posts.slice(0, 3).map(p => p.postText),
              postLinks: posts.map(p => p.postLink).filter(Boolean),
              totalEngagement: totalReactions + totalShares + totalComments,
              sentimentBreakdown: {
                positive: posts.filter(p => p.sentiment === "positive").length,
                neutral: posts.filter(p => p.sentiment === "neutral").length,
                negative: posts.filter(p => p.sentiment === "negative").length,
              },
            }),
          },
        })

        // Link all posts in this group to the news item
        await prisma.post.updateMany({
          where: {
            source: group.source,
            category: group.category,
            // Only link posts from the same date range
            postDate: {
              gte: firstPostDate,
              lte: lastPostDate,
            },
          },
          data: {
            newsItemId: newsItem.id,
          },
        })

        newsItemsCreated++
      } catch (error) {
        console.error(`[v0] Error creating news item for ${group.source}_${group.category}:`, error)
      }
    }

    console.log(
      `[v0] Data ingestion completed: ${postsProcessed} posts processed, ${newsItemsCreated} news items created`,
    )

    return NextResponse.json({
      success: true,
      message: "Data ingested and stored successfully",
      data: {
      postsProcessed,
      newsItemsCreated,
        totalPosts: transformedPosts.length,
      }
    })

  } catch (error) {
    console.error("[v0] Data ingestion failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { prisma } from "../../../lib/db"
import { calculateJaccardSimilarity, generateBaseKey } from "../../../lib/utils/text-similarity"

// Clear all data endpoint
export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] Clearing all data...")
    
    // Clear all data
    await prisma.post.deleteMany()
    await prisma.newsItem.deleteMany()
    await prisma.dailyAgg.deleteMany()
    await prisma.dataIngestionLog.deleteMany()
    
    console.log("[v0] All data cleared successfully")
    
    return NextResponse.json({
      success: true,
      message: "All data cleared successfully"
    })
  } catch (error) {
    console.error("[v0] Error clearing data:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

const API_URL = process.env.EXTERNAL_API_URL || "http://192.168.100.35:9051/api/posts/?page=1&page_size=200"

// Transform external API post format to internal format
function transformExternalPost(externalPost: any) {
  // Handle reactions - could be object with Total or direct number
  let reactions = 0
  if (typeof externalPost.reactions === "object" && externalPost.reactions !== null) {
    reactions = Number(externalPost.reactions.Total || 0)
  } else if (externalPost.reactions !== undefined) {
    reactions = Number(externalPost.reactions)
  }

  // Handle shares - could be total_shares or shares
  let shares = 0
  if (externalPost.total_shares !== undefined) {
    shares = Number(externalPost.total_shares)
  } else if (externalPost.shares !== undefined) {
    shares = Number(externalPost.shares)
  }

  // Handle comments - could be total_comments or comments
  let comments = 0
  if (externalPost.total_comments !== undefined) {
    comments = Number(externalPost.total_comments)
  } else if (externalPost.comments !== undefined) {
    comments = Number(externalPost.comments)
  }

  // Handle category - could be topic array or direct category
  let category = null;
  if (Array.isArray(externalPost.topic) && externalPost.topic.length > 0) {
    category = externalPost.topic[0];
  } else if (externalPost.category) {
    category = externalPost.category;
  }

  // Handle post date - could be posted_at or post_date
  let postDate = new Date()
  if (externalPost.posted_at) {
    postDate = new Date(externalPost.posted_at)
  } else if (externalPost.post_date) {
    postDate = new Date(externalPost.post_date)
  }

  // Handle post link - could be post_url or post_link
  let postLink = null
  if (externalPost.post_url) {
    postLink = externalPost.post_url
  } else if (externalPost.post_link) {
    postLink = externalPost.post_link
  }

  // Handle featured images - convert array to string or null
  let featuredImages = null
  if (Array.isArray(externalPost.featured_images_path) && externalPost.featured_images_path.length > 0) {
    featuredImages = externalPost.featured_images_path.join(',')
  }

  // Handle sentiment - normalize to lowercase
  let sentiment = "neutral"
  if (externalPost.sentiment) {
    const raw = String(externalPost.sentiment).toLowerCase()
    if (raw.includes("positive")) sentiment = "positive"
    else if (raw.includes("negative")) sentiment = "negative"
    else if (raw.includes("neutral")) sentiment = "neutral"
    else sentiment = "neutral"
  }

  return {
    post_id: externalPost.post_id || externalPost.id || String(Math.random()),
    post_text: externalPost.post_text || externalPost.text || "",
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

// Calculate trending score (virality): shares×5 + comments×2 + reactions×1
function calculateTrendingScore(reactions: number, shares: number, comments: number, postDate: Date): number {
  const score = shares * 5 + comments * 2 + reactions * 1
  return score
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting data ingestion process...")

    let allPosts: any[] = []
    let currentPage = 1
    const pageSize = 200 // Maximum page size
    let totalPages: number | null = null

    // Fetch all pages of data (robust loop that relies on total_pages if present, otherwise continues until empty page)
    // Also supports APIs that return either `result` or `results` arrays
    while (true) {
      try {
        console.log(`[v0] Fetching page ${currentPage}...`)
        
        const response = await axios.get(`${API_URL}?page=${currentPage}&page_size=${pageSize}`, {
      timeout: 30000, // 30 second timeout
    })

        const data = response.data
        
        const pageItems: any[] = Array.isArray(data.result)
          ? data.result
          : Array.isArray(data.results)
          ? data.results
          : []

        if (pageItems.length === 0) {
          console.log(`[v0] Page ${currentPage} returned 0 items; assuming end of data.`)
          break
        }

        allPosts = allPosts.concat(pageItems)
        console.log(`[v0] Fetched ${pageItems.length} posts from page ${currentPage}`)

        // Determine total pages if provided
        if (typeof data.total_pages === 'number') {
          totalPages = data.total_pages
        }

        // Debug: Log pagination info
        console.log(`[v0] Page ${currentPage} - current_page: ${data.current_page}, total_pages: ${data.total_pages}, has_next: ${Boolean(data.next)}`)
        
        // Force stop after 3 pages since API lies about pagination
        if (currentPage >= 3) {
          console.log(`[v0] Force stopping at page ${currentPage} (API limit reached)`)
          break
        }
        
        // Next page condition: prefer numerical paging info when available
        const hasMoreByNumbers = typeof data.current_page === 'number' && typeof data.total_pages === 'number'
          ? data.current_page < data.total_pages
          : null

        // Only use link-based pagination if we don't have numerical info
        const hasMoreByLink = hasMoreByNumbers === null && Boolean(data.next)

        console.log(`[v0] hasMoreByNumbers: ${hasMoreByNumbers}, hasMoreByLink: ${hasMoreByLink}`)

        if (hasMoreByNumbers === true || hasMoreByLink) {
          currentPage++
          console.log(`[v0] Continuing to page ${currentPage}`)
        } else {
          console.log(`[v0] Stopping pagination at page ${currentPage}`)
          break
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
        if (!apiPost.post_id) {
          console.log(`[v0] Skipping post with missing post_id`)
          continue
        }

        // Fallback text to avoid skipping posts entirely
        if (!apiPost.post_text || apiPost.post_text.trim().length === 0) {
          apiPost.post_text = `[No text] ${apiPost.source || ''}`.trim()
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
    
    // Get all posts for analysis
    const dbPosts = await prisma.post.findMany({
      orderBy: { postDate: 'desc' },
      take: 1000, // Limit to recent posts for performance
    })
    
    // Group posts by content similarity and source/category
    const newsGroups: Array<{
      baseKey: string
      category: string
      sources: Set<string>
      platforms: Set<string>
      posts: Array<{
        id: string
        postText: string
        source: string
        platform: string
        postDate: Date
        reactions: number
        shares: number
        comments: number
        trendingScore: number
        sentiment: string
        postLink: string | null
        category: string | null
      }>
      totalReactions: number
      totalShares: number
      totalComments: number
      avgTrendingScore: number
      firstPostDate: Date
      lastPostDate: Date
    }> = []
    
    // Process each post to find similar content
    for (const post of dbPosts) {
      let addedToGroup = false
      
      // Check if post can be added to existing group
      for (const group of newsGroups) {
        const similarity = calculateJaccardSimilarity(post.postText, group.posts[0].postText)
        
        // If similar content and same category, add to group
        if (similarity >= 0.3 && (post.category || 'uncategorized') === group.category) {
          group.posts.push({
            id: post.id,
            postText: post.postText,
            source: post.source,
            platform: post.platform,
            postDate: post.postDate,
            reactions: post.reactions,
            shares: post.shares,
            comments: post.comments,
            trendingScore: post.trendingScore,
            sentiment: post.sentiment || 'neutral',
            postLink: post.postLink,
            category: post.category,
          })
          group.sources.add(post.source)
          group.platforms.add(post.platform)
          group.totalReactions += post.reactions
          group.totalShares += post.shares
          group.totalComments += post.comments
          group.avgTrendingScore = (group.avgTrendingScore + post.trendingScore) / 2
          group.firstPostDate = new Date(Math.min(group.firstPostDate.getTime(), post.postDate.getTime()))
          group.lastPostDate = new Date(Math.max(group.lastPostDate.getTime(), post.postDate.getTime()))
          addedToGroup = true
          break
        }
      }
      
      // If no similar group found, create new group
      if (!addedToGroup) {
        const baseKey = generateBaseKey(post.postText)
        newsGroups.push({
          baseKey,
          category: post.category || 'uncategorized',
          sources: new Set([post.source]),
          platforms: new Set([post.platform]),
          posts: [{
            id: post.id,
            postText: post.postText,
            source: post.source,
            platform: post.platform,
            postDate: post.postDate,
            reactions: post.reactions,
            shares: post.shares,
            comments: post.comments,
            trendingScore: post.trendingScore,
            sentiment: post.sentiment || 'neutral',
            postLink: post.postLink,
            category: post.category,
          }],
          totalReactions: post.reactions,
          totalShares: post.shares,
          totalComments: post.comments,
          avgTrendingScore: post.trendingScore,
          firstPostDate: post.postDate,
          lastPostDate: post.postDate,
        })
      }
    }

    for (const group of newsGroups) {
      try {
        const posts = group.posts
        const sources = Array.from(group.sources)
        const platforms = Array.from(group.platforms)

        if (posts.length === 0) continue

        const totalReactions = group.totalReactions
        const totalShares = group.totalShares
        const totalComments = group.totalComments
        const avgTrendingScore = group.avgTrendingScore
        const firstPostDate = group.firstPostDate
        const lastPostDate = group.lastPostDate

        const groupKey = `${group.baseKey}_${firstPostDate.toISOString().split('T')[0]}`

        // Create or update news item
        const newsItem = await prisma.newsItem.upsert({
          where: {
            groupKey: groupKey,
          },
          create: {
            groupKey: groupKey,
            category: group.category || 'uncategorized',
            primarySource: sources[0],
            primaryPlatform: platforms[0],
            totalReactions,
            totalShares,
            totalComments,
            sourceCount: sources.length,
            platformCount: platforms.length,
            postCount: posts.length,
            avgTrendingScore,
            firstPostDate,
            lastPostDate,
            postAnalysisJson: JSON.stringify({
              sources: sources,
              platforms: platforms,
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
            postCount: posts.length,
            avgTrendingScore,
            lastPostDate,
            postAnalysisJson: JSON.stringify({
              sources: sources,
              platforms: platforms,
              sampleTexts: posts.slice(0, 3).map(p => p.postText),
              postLinks: posts.map(p => p.postLink).filter(Boolean),
              totalEngagement: totalReactions + totalShares + totalComments,
              sentimentBreakdown: {
                positive: posts.filter(p => p.sentiment === "neutral").length,
                neutral: posts.filter(p => p.sentiment === "neutral").length,
                negative: posts.filter(p => p.sentiment === "negative").length,
              },
            }),
          },
        })

        // Link all posts in this group to the news item
        await prisma.post.updateMany({
          where: {
            id: { in: posts.map(p => p.id) },
          },
          data: {
            newsItemId: newsItem.id,
          },
        })

        newsItemsCreated++
      } catch (error) {
        console.error(`[v0] Error creating news item for ${group.baseKey}:`, error)
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

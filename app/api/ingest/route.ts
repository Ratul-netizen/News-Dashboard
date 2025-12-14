import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { prisma } from "../../../lib/db"
import { calculateJaccardSimilarity, generateBaseKey } from "../../../lib/utils/text-similarity"
import { getTokenService } from "../../../lib/services/token-refresh-service"

// Clear all data endpoint
export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] Clearing all data...")

    // Clear all data
    await prisma.post.deleteMany()
    await prisma.newsItem.deleteMany()
    await (prisma as any).source.deleteMany()
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

const API_URL = process.env.EXTERNAL_API_URL || "http://192.168.100.36:9051/api/posts/"
const SOURCES_API_URL = process.env.EXTERNAL_SOURCES_API_URL || "http://192.168.100.36:9051/api/sources/"
const AUTH_URL = process.env.EXTERNAL_AUTH_URL
const API_EMAIL = process.env.EXTERNAL_API_EMAIL || "cttc_admin@technometrics.net"
const API_PASSWORD = process.env.EXTERNAL_API_PASSWORD || "Tech_@cttc"
const STATIC_API_TOKEN = process.env.EXTERNAL_API_TOKEN
const AUTH_SCHEME_OVERRIDE = process.env.EXTERNAL_AUTH_SCHEME // e.g. "Token" or "Bearer"

// Token cache for automatic authentication
let cachedToken: string | null = null
let tokenExpiry: number | null = null
let lastAuthAttempt: number = 0
const AUTH_RETRY_DELAY = 30000 // 30 seconds between auth attempts

// Build a paged URL from a base that may already contain query params
function buildPagedUrl(baseUrl: string, page: number, pageSize: number): string {
  try {
    const url = new URL(baseUrl)
    url.searchParams.set("page", String(page))
    url.searchParams.set("page_size", String(pageSize))
    return url.toString()
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?"
    return `${baseUrl}${separator}page=${page}&page_size=${pageSize}`
  }
}

// Check if token is expired or about to expire
function isTokenExpired(): boolean {
  if (!cachedToken || !tokenExpiry) return true
  const now = Date.now()
  // Refresh token if it expires in the next 5 minutes
  return now >= (tokenExpiry - 5 * 60 * 1000)
}

// Parse JWT token to get expiry time
function parseTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.exp ? payload.exp * 1000 : null // Convert to milliseconds
  } catch {
    return null
  }
}

// Enhanced JWT authentication with multiple strategies
async function performAuthentication(): Promise<string | null> {
  const now = Date.now()

  // Rate limiting: don't attempt auth more than once every 30 seconds
  if (now - lastAuthAttempt < AUTH_RETRY_DELAY) {
    console.log("[v0] Auth rate limited, using cached token or waiting...")
    return cachedToken
  }

  lastAuthAttempt = now

  if (!API_EMAIL || !API_PASSWORD) {
    console.warn("[v0] Authentication credentials not configured")
    return null
  }

  try {
    console.log("[v0] Attempting JWT authentication...")

    // Strategy 1: Try the configured auth URL
    if (AUTH_URL) {
      const token = await tryAuthenticationEndpoint(AUTH_URL)
      if (token) return token
    }

    // Strategy 2: Try common authentication patterns
    const baseUrl = AUTH_URL ? AUTH_URL.split('/api')[0] : 'http://192.168.100.36:9053'
    const authEndpoints = [
      `${baseUrl}/api/login`,
      `${baseUrl}/api/auth/login`,
      `${baseUrl}/api/token`,
      `${baseUrl}/api/authenticate`,
      `${baseUrl}/api/auth/token`,
      `${baseUrl}/api/auth/authenticate`,
      `${baseUrl}/audit/user/login`,
      `${baseUrl}/audit/user/authenticate`,
      `${baseUrl}/auth/login`,
      `${baseUrl}/auth/token`,
    ]

    for (const endpoint of authEndpoints) {
      const token = await tryAuthenticationEndpoint(endpoint)
      if (token) return token
    }

    // Strategy 3: Try different request formats
    const alternativeEndpoints = [
      'http://192.168.100.36:9053/api/login',
      'http://192.168.100.36:9053/api/auth/login',
      'http://192.168.100.36:9053/api/token',
    ]

    for (const endpoint of alternativeEndpoints) {
      const token = await tryAlternativeAuth(endpoint)
      if (token) return token
    }

    console.warn("[v0] All authentication strategies failed")
    return null

  } catch (error) {
    console.error("[v0] Authentication error:", error instanceof Error ? error.message : error)
    return null
  }
}

function extractToken(data: any, headers?: any): string | null {
  try {
    // Common top-level fields
    const direct = data?.access || data?.token || data?.auth_token || data?.key || data?.access_token || data?.jwt
    if (direct) return String(direct)
    // Common nested token containers
    if (data?.token?.access_token) return String(data.token.access_token)
    if (data?.data?.token?.access_token) return String(data.data.token.access_token)
    if (data?.token?.access) return String(data.token.access)
    if (data?.data?.token?.access) return String(data.data.token.access)
    // Nested under data or result
    const nested = data?.data?.access || data?.data?.token || data?.result?.access || data?.result?.token
    if (nested && typeof nested === 'string') return String(nested)
    // Sometimes token is returned in Authorization header
    const authHeader = headers?.authorization || headers?.Authorization
    if (authHeader && String(authHeader).toLowerCase().startsWith('bearer ')) {
      return String(authHeader).slice(7).trim()
    }
  } catch { }
  return null
}

// Try authentication with standard format
async function tryAuthenticationEndpoint(endpoint: string): Promise<string | null> {
  try {
    console.log(`[v0] Trying authentication endpoint: ${endpoint}`)

    const response = await axios.post(endpoint, {
      email: API_EMAIL,
      username: API_EMAIL,
      password: API_PASSWORD,
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    const data = response.data || {}
    const token = extractToken(data, response.headers)

    if (token) {
      console.log(`[v0] ✅ Authentication successful with endpoint: ${endpoint}`)
      cachedToken = token
      tokenExpiry = parseTokenExpiry(token)
      return token
    }

    console.log(`[v0] ❌ Endpoint ${endpoint} returned no token. Response keys:`, Object.keys(data))
    return null

  } catch (error: any) {
    console.log(`[v0] ❌ Endpoint ${endpoint} failed:`, error.response?.status || error.message)
    return null
  }
}

// Try alternative authentication formats
async function tryAlternativeAuth(endpoint: string): Promise<string | null> {
  const authFormats = [
    // Standard format
    { email: API_EMAIL, username: API_EMAIL, password: API_PASSWORD },
    // Alternative format 1
    { username: API_EMAIL, password: API_PASSWORD },
    // Alternative format 2
    { user: API_EMAIL, pass: API_PASSWORD },
    // Alternative format 3
    { login: API_EMAIL, password: API_PASSWORD },
  ]

  for (const authData of authFormats) {
    try {
      console.log(`[v0] Trying alternative auth format on ${endpoint}`)

      const response = await axios.post(endpoint, authData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const data = response.data || {}
      const token = extractToken(data, response.headers)

      if (token) {
        console.log(`[v0] ✅ Alternative auth successful with endpoint: ${endpoint}`)
        cachedToken = token
        tokenExpiry = parseTokenExpiry(token)
        return token
      }
    } catch (error: any) {
      console.log(`[v0] ❌ Alternative auth failed for ${endpoint}:`, error.response?.status || error.message)
      continue
    }
  }

  // Final fallback: form-encoded credentials (common in some auth servers)
  try {
    console.log(`[v0] Trying form-encoded auth on ${endpoint}`)
    const form = new URLSearchParams()
    form.append('username', String(API_EMAIL))
    form.append('password', String(API_PASSWORD))
    const response = await axios.post(endpoint, form.toString(), {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    })
    const data = response.data || {}
    const token = extractToken(data, response.headers)
    if (token) {
      console.log(`[v0] ✅ Form-encoded auth successful with endpoint: ${endpoint}`)
      cachedToken = token
      tokenExpiry = parseTokenExpiry(token)
      return token
    }
  } catch (err: any) {
    console.log(`[v0] ❌ Form-encoded auth failed for ${endpoint}:`, err.response?.status || err.message)
  }

  return null
}

// Resolve auth headers for external API with automatic token management
async function getExternalApiAuthHeaders(): Promise<Record<string, string>> {
  // Try to use the new token service first
  const tokenService = getTokenService()
  if (tokenService) {
    try {
      console.log("[v0] Using automatic token service for authentication")
      return await tokenService.getAuthHeaders()
    } catch (error) {
      console.warn("[v0] Token service failed, falling back to legacy auth:", error)
    }
  }

  // Fallback to legacy authentication system
  // If user set a static token, ALWAYS use it first
  if (STATIC_API_TOKEN && STATIC_API_TOKEN.trim().length > 0) {
    console.log("[v0] Using static API token for authentication")
    return { Authorization: `Bearer ${STATIC_API_TOKEN}` }
  }

  // Check if we have a valid cached token
  if (cachedToken && !isTokenExpired()) {
    console.log("[v0] Using cached authentication token")
    return { Authorization: `Bearer ${cachedToken}` }
  }

  // Need to authenticate
  console.log("[v0] No valid cached token, performing authentication...")
  const token = await performAuthentication()

  if (token) {
    console.log("[v0] ✅ Authentication successful, using new token")
    return { Authorization: `Bearer ${token}` }
  }

  console.warn("[v0] ❌ Authentication failed, proceeding without auth")
  return {}
}

// Force login - always attempt fresh authentication
async function getExternalApiAuthHeadersForceLogin(): Promise<Record<string, string>> {
  // Try to use the new token service first
  const tokenService = getTokenService()
  if (tokenService) {
    try {
      console.log("[v0] Force login: Using automatic token service")
      return await tokenService.getAuthHeaders()
    } catch (error) {
      console.warn("[v0] Token service force login failed, falling back to legacy auth:", error)
    }
  }

  // Fallback to legacy authentication system
  // If static token is available, use it even in force login mode
  if (STATIC_API_TOKEN && STATIC_API_TOKEN.trim().length > 0) {
    console.log("[v0] Force login: Using static API token")
    return { Authorization: `Bearer ${STATIC_API_TOKEN}` }
  }

  console.log("[v0] Force login: Performing fresh authentication...")
  // Clear cached token to force fresh authentication
  cachedToken = null
  tokenExpiry = null

  const token = await performAuthentication()
  if (token) {
    console.log("[v0] ✅ Force login successful")
    return { Authorization: `Bearer ${token}` }
  }

  console.warn("[v0] ❌ Force login failed")
  return {}
}

// Helper: make an authenticated GET with a one-time re-login on 401
async function getWithAuth(url: string, timeoutMs: number) {
  const headers = await getExternalApiAuthHeaders()
  try {
    console.log(`[v0] Making authenticated request to: ${url}`)
    const response = await axios.get(url, { timeout: timeoutMs, headers })
    console.log(`[v0] ✅ Request successful: ${response.status}`)
    return response
  } catch (err: any) {
    const status = err?.response?.status
    console.log(`[v0] Request failed with status: ${status}`)

    if (status === 401) {
      console.log(`[v0] 401 Unauthorized, attempting fresh authentication...`)
      const retryHeaders = await getExternalApiAuthHeadersForceLogin()
      if (Object.keys(retryHeaders).length > 0) {
        console.log(`[v0] Retrying with fresh authentication...`)
        return await axios.get(url, { timeout: timeoutMs, headers: retryHeaders })
      }
    }

    // If authentication fails, try without auth headers (some APIs might work without auth)
    if (status === 401 || status === 403) {
      console.log(`[v0] Trying request without authentication...`)
      try {
        return await axios.get(url, { timeout: timeoutMs })
      } catch (fallbackErr: any) {
        console.log(`[v0] Fallback request also failed: ${fallbackErr.response?.status}`)
      }
    }

    throw err
  }
}

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

// Transform external API source format to internal format
function transformExternalSource(externalSource: any) {
  return {
    source_id: externalSource.source_id || externalSource.id || String(Math.random()),
    name: externalSource.name || externalSource.source_name || "Unknown",
    platform: externalSource.platform || "F",
    url: externalSource.url || externalSource.source_url || null,
    description: externalSource.description || null,
    category: externalSource.category || null,
    is_active: externalSource.is_active !== false, // Default to true if not specified
    created_at: externalSource.created_at ? new Date(externalSource.created_at) : new Date(),
    updated_at: externalSource.updated_at ? new Date(externalSource.updated_at) : new Date(),
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
    // Platforms to fetch posts for
    const postPlatforms = ['F', 'I', 'X', 'Y', 'T']

    for (const platform of postPlatforms) {
      console.log(`[v0] Fetching posts for platform: ${platform}`)
      let currentPage = 1
      const pageSize = 1000 // Maximum page size
      let totalPages: number | null = null

      // Fetch all pages of data for this platform
      while (true) {
        try {
          console.log(`[v0] Fetching posts page ${currentPage} for platform ${platform}...`)

          // Construct URL robustly using URL object
          const urlObj = new URL(API_URL)
          urlObj.searchParams.set("page", String(currentPage))
          urlObj.searchParams.set("page_size", String(pageSize))
          urlObj.searchParams.set("platform", platform)

          const url = urlObj.toString()

          const response = await getWithAuth(url, 30000)

          const data = response.data

          const pageItems: any[] = Array.isArray(data.result)
            ? data.result
            : Array.isArray(data.results)
              ? data.results
              : []

          if (pageItems.length === 0) {
            console.log(`[v0] Posts page ${currentPage} for platform ${platform} returned 0 items; moving to next platform.`)
            break
          }

          // Inject platform into the post objects since the API might not return it
          const postsWithPlatform = pageItems.map(post => ({
            ...post,
            platform: platform
          }))

          allPosts = allPosts.concat(postsWithPlatform)
          console.log(`[v0] Fetched ${pageItems.length} posts from page ${currentPage} for platform ${platform}`)

          // Determine total pages if provided
          if (typeof data.total_pages === 'number') {
            totalPages = data.total_pages
          }

          // Debug: Log pagination info
          console.log(`[v0] Page ${currentPage} - current_page: ${data.current_page}, total_pages: ${data.total_pages}, has_next: ${Boolean(data.next)}`)

          // Force stop after 3 pages since API lies about pagination (keeping original logic)
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
            console.log(`[v0] Continuing to page ${currentPage} for platform ${platform}`)
          } else {
            console.log(`[v0] Stopping pagination at page ${currentPage} for platform ${platform}`)
            break
          }

          // Add a small delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`[v0] Error fetching posts page ${currentPage} for platform ${platform}:`, error)
          break
        }
      }
    }

    console.log(`[v0] Total posts fetched: ${allPosts.length}`)

    // Fetch sources data
    console.log("[v0] Fetching sources data...")
    let allSources: any[] = []

    // Platforms to fetch sources for
    const platforms = ['F', 'I', 'X', 'Y', 'T']

    for (const platform of platforms) {
      console.log(`[v0] Fetching sources for platform: ${platform}`)
      let currentSourcePage = 1
      const sourcePageSize = 1000

      while (true) {
        try {
          console.log(`[v0] Fetching sources page ${currentSourcePage} for platform ${platform}...`)

          // Construct URL robustly using URL object
          const urlObj = new URL(SOURCES_API_URL)
          urlObj.searchParams.set("page", String(currentSourcePage))
          urlObj.searchParams.set("page_size", String(sourcePageSize))
          urlObj.searchParams.set("platform", platform)

          const url = urlObj.toString()

          const sourcesResponse = await getWithAuth(url, 30000)

          const sourcesData = sourcesResponse.data

          const pageSources: any[] = Array.isArray(sourcesData.result)
            ? sourcesData.result
            : Array.isArray(sourcesData.results)
              ? sourcesData.results
              : []

          if (pageSources.length === 0) {
            console.log(`[v0] Sources page ${currentSourcePage} for platform ${platform} returned 0 items; moving to next platform.`)
            break
          }

          // Inject platform into the source objects since the API might not return it
          const sourcesWithPlatform = pageSources.map(source => ({
            ...source,
            platform: platform
          }))

          allSources = allSources.concat(sourcesWithPlatform)
          console.log(`[v0] Fetched ${pageSources.length} sources from page ${currentSourcePage} for platform ${platform}`)

          // Check if there are more pages
          if (typeof sourcesData.current_page === 'number' && typeof sourcesData.total_pages === 'number') {
            if (sourcesData.current_page < sourcesData.total_pages) {
              currentSourcePage++
            } else {
              break
            }
          } else if (sourcesData.next) {
            currentSourcePage++
          } else {
            break
          }

          // Add a small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`[v0] Error fetching sources page ${currentSourcePage} for platform ${platform}:`, error)
          break
        }
      }
    }

    console.log(`[v0] Total sources fetched: ${allSources.length}`)

    // Transform external API format to internal format
    const transformedPosts = allPosts.map(transformExternalPost)
    const transformedSources = allSources.map(transformExternalSource)

    // Debug: Log a few transformed posts to see the structure
    console.log("[v0] Sample transformed post:", JSON.stringify(transformedPosts[0], null, 2))

    let postsProcessed = 0
    let newsItemsCreated = 0
    let newsItemsUpdated = 0
    let sourcesProcessed = 0

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
        // Ensure postId is always a string
        const postIdString = String(apiPost.post_id)

        // Check if post already exists
        const existingPost = await prisma.post.findFirst({
          where: {
            postId: postIdString,
          },
        })

        if (existingPost) {
          console.log(`[v0] Updating existing post: ${postIdString}`)
          // Update existing post
          await prisma.post.update({
            where: {
              id: existingPost.id,
            },
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
          console.log(`[v0] Creating new post: ${postIdString}`)
          // Create new post
          await prisma.post.create({
            data: {
              postId: postIdString,
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

    // Process each source
    console.log("[v0] Processing sources...")
    for (const apiSource of transformedSources) {
      try {
        console.log(`[v0] Processing source: ${apiSource.source_id} - ${apiSource.name}`)

        // Validate required fields
        if (!apiSource.source_id) {
          console.log(`[v0] Skipping source with missing source_id`)
          continue
        }

        // Check if source already exists
        const existingSource = await (prisma as any).source.findUnique({
          where: { sourceId: apiSource.source_id },
        })

        if (existingSource) {
          console.log(`[v0] Updating existing source: ${apiSource.source_id}`)
          // Update existing source
          await (prisma as any).source.update({
            where: { sourceId: apiSource.source_id },
            data: {
              name: apiSource.name,
              platform: apiSource.platform,
              url: apiSource.url,
              description: apiSource.description,
              category: apiSource.category,
              isActive: apiSource.is_active,
              updatedAt: apiSource.updated_at,
            },
          })
        } else {
          console.log(`[v0] Creating new source: ${apiSource.source_id}`)
          // Create new source
          await (prisma as any).source.create({
            data: {
              sourceId: apiSource.source_id,
              name: apiSource.name,
              platform: apiSource.platform,
              url: apiSource.url,
              description: apiSource.description,
              category: apiSource.category,
              isActive: apiSource.is_active,
              createdAt: apiSource.created_at,
              updatedAt: apiSource.updated_at,
            },
          })
        }

        sourcesProcessed++
        console.log(`[v0] Successfully processed source ${sourcesProcessed}/${transformedSources.length}`)
      } catch (error) {
        console.error(`[v0] Error processing source ${apiSource.source_id}:`, error)
        console.error(`[v0] Source data:`, JSON.stringify(apiSource, null, 2))
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

        const len1 = post.postText.length
        const len2 = group.posts[0].postText.length
        const ratio = len1 > len2 ? len2 / len1 : len1 / len2

        // If similar content (threshold 0.45) and similar length (>0.5 ratio) and same category, add to group
        if (ratio >= 0.5 && similarity >= 0.45 && (post.category || 'uncategorized') === group.category) {
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
      `[v0] Data ingestion completed: ${postsProcessed} posts processed, ${sourcesProcessed} sources processed, ${newsItemsCreated} news items created`,
    )

    return NextResponse.json({
      success: true,
      message: "Data ingested and stored successfully",
      data: {
        postsProcessed,
        sourcesProcessed,
        newsItemsCreated,
        totalPosts: transformedPosts.length,
        totalSources: transformedSources.length,
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

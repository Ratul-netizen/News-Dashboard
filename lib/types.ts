import { z } from "zod"

// API Response Schema for validation
export const ApiPostSchema = z.object({
  post_id: z.string(),
  post_text: z.string(),
  post_date: z.string(),
  post_link: z.string().nullable(),
  platform: z.string(),
  source: z.string(),
  category: z.string().nullable(),
  reactions: z
    .number()
    .nullable()
    .transform((val) => val ?? 0),
  shares: z
    .number()
    .nullable()
    .transform((val) => val ?? 0),
  comments: z
    .number()
    .nullable()
    .transform((val) => val ?? 0),
  sentiment: z.string().nullable().transform((val) => val?.toLowerCase() || "neutral"),
  featured_images_path: z.string().nullable(),
})

export const ApiResponseSchema = z.array(ApiPostSchema)

export type ApiPost = z.infer<typeof ApiPostSchema>

// Database Types
export interface PostAnalysis {
  sources: string[]
  platforms: string[]
  sampleTexts: string[]
  postLinks: string[]
  totalEngagement: number
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
}

export interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  categories: string[]
  sources: string[]
  platforms: string[]
}

export interface TrendingPost {
  id: string
  postText: string
  category: string | null
  source: string
  platform: string
  reactions: number
  shares: number
  comments: number
  sourceCount: number
  postDate: Date
  postLink: string | null
  postAnalysis: PostAnalysis | null
  trendingScore: number
  sentiment: string
}

// Platform mapping for normalization
export const PLATFORM_MAPPING: Record<string, string> = {
  F: "facebook.com",
  T: "twitter.com",
  I: "instagram.com",
  Y: "youtube.com",
  L: "linkedin.com",
  TT: "tiktok.com",
  R: "reddit.com",
}

export const SENTIMENT_COLORS = {
  positive: "#10B981", // green-500
  neutral: "#6B7280", // gray-500
  negative: "#EF4444", // red-500
} as const

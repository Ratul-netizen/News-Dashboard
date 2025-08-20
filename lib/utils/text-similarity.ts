/**
 * Calculate Jaccard similarity between two strings
 * Used for grouping similar posts into news items
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
  // Normalize and tokenize text
  const normalize = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2), // Filter out short words
    )
  }

  const set1 = normalize(text1)
  const set2 = normalize(text2)

  // Calculate intersection and union
  const intersection = new Set([...set1].filter((x) => set2.has(x)))
  const union = new Set([...set1, ...set2])

  // Return Jaccard similarity coefficient
  return union.size === 0 ? 0 : intersection.size / union.size
}

/**
 * Generate a base key for grouping similar posts
 * Uses first 100 characters of normalized text
 */
export function generateBaseKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 100)
}

/**
 * Generate a group key for news items
 * Combines base key with date for temporal grouping
 */
export function generateGroupKey(baseKey: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0] // YYYY-MM-DD format
  return `${baseKey}_${dateStr}`
}

/**
 * Find similar posts within a time window
 */
export function findSimilarPosts(
  targetText: string,
  posts: Array<{ postText: string; postDate: Date }>,
  similarityThreshold = 0.3,
  timeWindowDays = 3,
): Array<{ postText: string; postDate: Date; similarity: number }> {
  const targetDate = new Date()
  const timeWindow = timeWindowDays * 24 * 60 * 60 * 1000 // Convert to milliseconds

  return posts
    .filter((post) => {
      const timeDiff = Math.abs(targetDate.getTime() - post.postDate.getTime())
      return timeDiff <= timeWindow
    })
    .map((post) => ({
      ...post,
      similarity: calculateJaccardSimilarity(targetText, post.postText),
    }))
    .filter((post) => post.similarity >= similarityThreshold)
    .sort((a, b) => b.similarity - a.similarity)
}

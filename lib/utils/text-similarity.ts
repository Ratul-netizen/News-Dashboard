/**
 * Calculate Jaccard similarity between two strings
 * Used for grouping similar posts into news items
 */
/**
 * Calculate similarity using Dice Coefficient on bigrams
 * Surpasses Jaccard for finding similar text with typos or word order issues.
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0

  // Clean text: lowercase, remove punctuation, reduce whitespace
  const clean = (text: string) => text.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim()

  const s1 = clean(text1)
  const s2 = clean(text2)

  if (s1 === s2) return 1.0
  if (s1.length < 2 || s2.length < 2) return 0.0

  // Create bigrams function
  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>()
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2)
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1)
    }
    return bigrams
  }

  const bigrams1 = getBigrams(s1)
  const bigrams2 = getBigrams(s2)

  let intersection = 0

  // Calculate size
  let len1 = 0
  bigrams1.forEach(count => len1 += count)

  let len2 = 0
  bigrams2.forEach(count => len2 += count)

  // Calculate intersection count
  bigrams1.forEach((count, bigram) => {
    if (bigrams2.has(bigram)) {
      intersection += Math.min(count, bigrams2.get(bigram)!)
    }
  })

  // Dice coefficient: 2 * (intersection) / (size1 + size2)
  return (2.0 * intersection) / (len1 + len2)
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

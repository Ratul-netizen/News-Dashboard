export class ContentScoringService {
  private static readonly CATEGORY_WEIGHTS = {
    'Politics': 9.5,
    'Accident': 9,
    'Crime': 10,
    'Corruption': 10,
    'Cyber Crime': 10,
    'International': 7.5,
    'National': 8,
    'Business': 7,
    'Technology': 6.5,
    'Entertainment': 4.0,
    'Other': 1,
    'Uncategorized': 1
  } as const

  /**
   * Calculate Source Weight based on engagement and posting frequency
   * Formula: (Like Weight + Follower Weight) * Post Per Day Weight
   */
  calculateSourceWeight(likes: number, followers: number, postsPerDay: number): number {
    const likeWeight = 100 * (likes / 1000)
    const followerWeight = 80 * (followers / 1000)
    const postPerDayWeight = 3 / Math.max(postsPerDay, 0.1) // Prevent division by zero
    
    return (likeWeight + followerWeight) * postPerDayWeight
  }

  /**
   * Calculate News Flow Weight based on engagement, recency, and category
   * Formula: (Like Weight + Share Weight + Comment Weight) * Date Weight * Category Weight
   */
  calculateNewsFlowWeight(
    reactions: number, 
    shares: number, 
    comments: number, 
    daysDifference: number,
    category: string
  ): {
    totalPostWeight: number
    totalPostWeightByCategory: number
  } {
    const likeWeight = 50 * reactions
    const shareWeight = 70 * shares
    const commentWeight = 90 * comments
    const dateWeight = 1 / Math.max(daysDifference, 1)
    const categoryWeight = ContentScoringService.CATEGORY_WEIGHTS[category as keyof typeof ContentScoringService.CATEGORY_WEIGHTS] || 1
    
    const totalPostWeight = (likeWeight + shareWeight + commentWeight) * dateWeight
    const totalPostWeightByCategory = totalPostWeight * categoryWeight
    
    return {
      totalPostWeight,
      totalPostWeightByCategory
    }
  }

  /**
   * Calculate Virality Score based on source and date counts from post analysis
   * Formula: MAX(1, MIN(7, FLOOR(0.75 × sources + 0.125 × dates, 1)))
   */
  calculateViralityScore(postAnalysisText: string): number {
    try {
      const sourceMatch = postAnalysisText.match(/Source:\s*([^,]+(?:,[^,]+)*)/i)
      const dateMatch = postAnalysisText.match(/Post date:\s*([^,]+(?:,[^,]+)*)/i)
      
      const sourceCount = sourceMatch ? sourceMatch[1].split(',').length : 0
      const dateCount = dateMatch ? dateMatch[1].split(',').length : 0
      
      const rawScore = 0.75 * sourceCount + 0.125 * dateCount
      return Math.max(1, Math.min(7, Math.floor(rawScore)))
    } catch (error) {
      console.warn('Error calculating virality score:', error)
      return 1 // Default fallback
    }
  }

  /**
   * Calculate Final Trending Score combining all factors
   * Formula: SCALED Trending By Category * Virality Score
   */
  calculateFinalTrendingScore(
    sourceWeight: number,
    newsFlowWeight: number,
    categoryWeight: number,
    viralityScore: number,
    maxTrendingScore: number
  ): number {
    const trendingByCategory = newsFlowWeight + sourceWeight
    const scaledTrending = maxTrendingScore > 0 ? 10 * (trendingByCategory / maxTrendingScore) : 0
    return scaledTrending * viralityScore
  }

  /**
   * Get category weight for a given category
   */
  getCategoryWeight(category: string): number {
    return ContentScoringService.CATEGORY_WEIGHTS[category as keyof typeof ContentScoringService.CATEGORY_WEIGHTS] || 1
  }

  /**
   * Calculate days difference from a given date to today
   */
  calculateDaysDifference(postDate: Date): number {
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - postDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate posts per day (estimated based on total posts and date range)
   */
  calculatePostsPerDay(totalPosts: number, firstPostDate: Date, lastPostDate: Date): number {
    const daysDiff = this.calculateDaysDifference(firstPostDate)
    return daysDiff > 0 ? totalPosts / daysDiff : 1
  }

  /**
   * Get all available category weights
   */
  static getCategoryWeights() {
    return this.CATEGORY_WEIGHTS
  }
}

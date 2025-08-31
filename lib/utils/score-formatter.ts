/**
 * Utility functions for formatting scoring values in a user-friendly way
 */

/**
 * Format a large number to K (thousands) or M (millions) format
 * @param value - The number to format
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "13.7K", "1.2M")
 */
export function formatScore(value: number, precision: number = 1): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(precision) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(precision) + 'K'
  }
  return value.toFixed(precision)
}

/**
 * Format a score with appropriate precision based on its magnitude
 * @param value - The number to format
 * @returns Formatted string with appropriate precision
 */
export function formatScoreSmart(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 10000) {
    return (value / 1000).toFixed(0) + 'K'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  } else if (value >= 100) {
    return value.toFixed(0)
  } else if (value >= 10) {
    return value.toFixed(1)
  } else {
    return value.toFixed(2)
  }
}

/**
 * Format virality score (1-7) with descriptive text
 * @param score - The virality score (1-7)
 * @returns Descriptive string
 */
export function formatViralityScore(score: number): string {
  const descriptions = {
    1: 'Low',
    2: 'Low-Medium',
    3: 'Medium',
    4: 'Medium-High',
    5: 'High',
    6: 'Very High',
    7: 'Viral'
  }
  return `${score} (${descriptions[score as keyof typeof descriptions] || 'Unknown'})`
}

/**
 * Format category weight with color coding
 * @param weight - The category weight
 * @returns Formatted string with weight description
 */
export function formatCategoryWeight(weight: number): string {
  if (weight >= 9) {
    return `${weight} (Critical)`
  } else if (weight >= 7) {
    return `${weight} (High)`
  } else if (weight >= 5) {
    return `${weight} (Medium)`
  } else {
    return `${weight} (Low)`
  }
}

/**
 * Get color class for category weight (for UI styling)
 * @param weight - The category weight
 * @returns Tailwind CSS color class
 */
export function getCategoryWeightColor(weight: number): string {
  if (weight >= 9) {
    return 'text-red-500' // Critical - Red
  } else if (weight >= 7) {
    return 'text-orange-500' // High - Orange
  } else if (weight >= 5) {
    return 'text-yellow-500' // Medium - Yellow
  } else {
    return 'text-gray-500' // Low - Gray
  }
}

/**
 * Format trending score with trend indicator
 * @param score - The trending score
 * @param previousScore - Previous trending score for comparison
 * @returns Formatted string with trend indicator
 */
export function formatTrendingScore(score: number, previousScore?: number): string {
  if (previousScore === undefined) {
    return formatScoreSmart(score)
  }
  
  const change = score - previousScore
  const changePercent = previousScore > 0 ? (change / previousScore) * 100 : 0
  
  let trend = ''
  if (changePercent > 10) {
    trend = ' ↗️' // Rising
  } else if (changePercent < -10) {
    trend = ' ↘️' // Falling
  } else {
    trend = ' →' // Stable
  }
  
  return `${formatScoreSmart(score)}${trend}`
}

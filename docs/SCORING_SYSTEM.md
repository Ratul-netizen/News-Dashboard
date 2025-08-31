# Content Scoring System

This document explains the sophisticated content ranking and virality scoring system implemented in the news dashboard.

## Overview

The scoring system calculates trending scores based on multiple weighted factors including engagement, recency, category importance, source quality, and content spread. This provides much more meaningful content ranking than simple engagement counts.

## Components

### 1. Source Weight Calculation

**Purpose**: Evaluates the quality and credibility of content sources.

**Formula**: `(Like Weight + Follower Weight) × Post Per Day Weight`

- **Like Weight**: `100 × (Likes ÷ 1000)`
- **Follower Weight**: `80 × (Followers ÷ 1000)`
- **Post Per Day Weight**: `3 ÷ Posts per day`

**Example**:
- High engagement source: 5K likes, 10K followers, 2 posts/day = **1,950.00**
- Low engagement source: 100 likes, 500 followers, 5 posts/day = **30.00**

### 2. News Flow Weight Calculation

**Purpose**: Evaluates individual post performance based on engagement, recency, and category.

**Formula**: `(Like Weight + Share Weight + Comment Weight) × Date Weight × Category Weight`

- **Like Weight**: `50 × Reactions`
- **Share Weight**: `70 × Shares`
- **Comment Weight**: `90 × Comments`
- **Date Weight**: `1 ÷ Days Difference`
- **Category Weight**: Multiplier based on content type

**Category Weights**:
- **Crime/Corruption/Cyber Crime**: 10.0 (Critical)
- **Politics**: 9.5 (Critical)
- **Accident**: 9.0 (High)
- **National**: 8.0 (High)
- **International**: 7.5 (High)
- **Business**: 7.0 (Medium)
- **Technology**: 6.5 (Medium)
- **Entertainment**: 4.0 (Low)
- **Other/Uncategorized**: 1.0 (Low)

**Example**:
- High engagement Crime post (1K reactions, 500 shares, 200 comments, 1 day old):
  - Total Post Weight: **103,000.00**
  - Total Post Weight By Category: **1,030,000.00**

### 3. Virality Score Calculation

**Purpose**: Measures content spread based on source and date diversity.

**Formula**: `MAX(1, MIN(7, FLOOR(0.75 × sources + 0.125 × dates, 1)))`

**Scoring**:
- **1**: Low virality (single source, single date)
- **4**: Medium virality (multiple sources, multiple dates)
- **7**: Viral (many sources, many dates)

**Example**:
- "Source: CNN, BBC, Reuters, Post date: 2024-01-15, 2024-01-16, 2024-01-17" → **4**
- "Source: Local News, Post date: 2024-01-15" → **1**

### 4. Final Trending Score

**Purpose**: Combines all factors into a single, meaningful score.

**Formula**: `SCALED Trending By Category × Virality Score`

Where:
- **Trending By Category** = News Flow Weight + Source Weight
- **Scaled Trending** = `10 × (Trending By Category ÷ MAX(Trending By Category))`

## Implementation

### Files

- **`lib/services/scoring-service.ts`**: Core scoring logic
- **`lib/utils/score-formatter.ts`**: Utility functions for formatting scores
- **`lib/types.ts`**: Updated types with new scoring fields
- **`app/api/search/route.ts`**: Search API with scoring integration
- **`app/api/dashboard/route.ts`**: Dashboard API with scoring integration

### Usage

```typescript
import { ContentScoringService } from '@/lib/services/scoring-service'
import { formatScore, formatViralityScore } from '@/lib/utils/score-formatter'

const scoringService = new ContentScoringService()

// Calculate source weight
const sourceWeight = scoringService.calculateSourceWeight(likes, followers, postsPerDay)

// Calculate news flow weight
const { totalPostWeight, totalPostWeightByCategory } = scoringService.calculateNewsFlowWeight(
  reactions, shares, comments, daysDifference, category
)

// Calculate virality score
const viralityScore = scoringService.calculateViralityScore(postAnalysisText)

// Calculate final trending score
const finalScore = scoringService.calculateFinalTrendingScore(
  sourceWeight, newsFlowWeight, categoryWeight, viralityScore, maxTrendingScore
)

// Format for display
const formattedScore = formatScore(finalScore)
const formattedVirality = formatViralityScore(viralityScore)
```

## API Response Format

The updated APIs now return posts with additional scoring fields:

```typescript
interface TrendingPost {
  // ... existing fields ...
  sourceWeight: number              // Source quality score
  newsFlowWeight: number            // Post engagement score
  newsFlowWeightByCategory: number  // Post score with category multiplier
  viralityScore: number             // Content spread score (1-7)
  finalTrendingScore: number        // Final combined score
}
```

## Benefits

1. **Better Content Ranking**: More sophisticated than simple engagement counts
2. **Quality Over Quantity**: Penalizes spam, rewards genuine engagement
3. **Category Intelligence**: Different content types get appropriate weighting
4. **Time Sensitivity**: Newer content gets higher priority
5. **Source Quality**: Accounts for source credibility and audience size
6. **Content Spread**: Rewards content that spreads across multiple sources

## Configuration

### Category Weights

Category weights can be adjusted in `ContentScoringService.CATEGORY_WEIGHTS`:

```typescript
private static readonly CATEGORY_WEIGHTS = {
  'Politics': 9.5,
  'Crime': 10.0,
  'Business': 7.0,
  // ... add more categories
}
```

### Scoring Multipliers

Engagement multipliers can be adjusted in the respective calculation methods:

```typescript
// In calculateNewsFlowWeight method
const likeWeight = 50 * reactions      // Adjust 50
const shareWeight = 70 * shares        // Adjust 70
const commentWeight = 90 * comments    // Adjust 90
```

## Testing

The system has been tested with various scenarios and edge cases. All calculations produce expected results within the defined formulas.

## Future Enhancements

1. **Machine Learning**: Integrate ML models for dynamic weight adjustment
2. **User Feedback**: Incorporate user engagement patterns
3. **Real-time Updates**: Dynamic scoring based on current trends
4. **A/B Testing**: Test different scoring algorithms
5. **Performance Metrics**: Track scoring accuracy and user satisfaction

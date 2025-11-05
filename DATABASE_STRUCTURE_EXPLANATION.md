# Database Structure: Posts vs NewsItems

## Overview

Your database has a **two-tier structure** to organize news data:

1. **Post** (299 records) - Individual social media posts
2. **NewsItem** (103 records) - Grouped/clustered posts representing the same news story

## The Relationship

```
Post (299) ──many-to-one──> NewsItem (103)
```

**Multiple Posts can belong to ONE NewsItem**

## How Posts Are Grouped into NewsItems

### Grouping Logic:
1. **Content Similarity**: Posts with similar text content (Jaccard similarity ≥ 0.3)
2. **Same Category**: Posts must share the same category
3. **Time Window**: Posts posted around similar times

### Example:
If the same news story is posted by:
- Jamuna Television
- Nagad
- Amar bKash

These 3 **Posts** would be grouped into 1 **NewsItem** representing that news story.

## Why The Difference?

### 299 Posts / 103 NewsItems = ~2.9 posts per news item

This means:
- Some news stories have multiple posts (shared by different sources)
- Some posts might be unique (not similar to others)
- Popular stories might have 5-10 posts grouped together

## What The Dashboard Shows

The dashboard displays **NewsItems**, not individual Posts. That's why you see:
- **103 posts** in the dashboard (one row per NewsItem)
- Each NewsItem shows aggregate data:
  - Total reactions (sum of all posts in that group)
  - Total shares (sum of all posts in that group)
  - Primary source (source with most engagement)
  - Average trending score

## Benefits of This Structure

1. **Deduplication**: Same news story doesn't appear multiple times
2. **Aggregation**: Combined engagement metrics show true popularity
3. **Efficiency**: Easier to analyze trends when similar content is grouped
4. **Clarity**: One news item per story, regardless of how many sources posted it

## Database Schema

```prisma
model Post {
  // Individual post data
  postText, postDate, reactions, shares, etc.
  newsItemId  // Links to NewsItem
}

model NewsItem {
  // Aggregated data
  totalReactions, totalShares, postCount
  posts[]  // Array of related Posts
}
```

## Checking Individual Posts

If you want to see all 299 individual posts:
- Use Prisma Studio at http://localhost:5555
- Navigate to the "Post" model
- There you'll see all 299 individual posts

If you want to see which posts belong to a NewsItem:
- Click on a NewsItem in Prisma Studio
- Expand the "posts" relationship to see all related posts


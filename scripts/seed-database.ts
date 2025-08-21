import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleCategories = [
  'Technology', 'Politics', 'Entertainment', 'Sports', 'Business', 
  'Health', 'Science', 'Environment', 'Education', 'World News'
]

const sampleSources = [
  'CNN', 'BBC', 'Reuters', 'Associated Press', 'The New York Times',
  'The Washington Post', 'USA Today', 'Fox News', 'MSNBC', 'ABC News'
]

const samplePlatforms = ['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'YouTube']

const sampleSentiments = ['positive', 'neutral', 'negative']

// Generate random date within the last 30 days
function getRandomDate(): Date {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
  return new Date(randomTime)
}

// Generate random trending score
function getRandomTrendingScore(): number {
  return Math.random() * 100
}

// Generate sample posts
function generateSamplePosts(count: number) {
  const posts: any[] = []
  
  for (let i = 0; i < count; i++) {
    const category = sampleCategories[Math.floor(Math.random() * sampleCategories.length)]
    const source = sampleSources[Math.floor(Math.random() * sampleSources.length)]
    const platform = samplePlatforms[Math.floor(Math.random() * samplePlatforms.length)]
    const sentiment = sampleSentiments[Math.floor(Math.random() * sampleSentiments.length)]
    const postDate = getRandomDate()
    
    const reactions = Math.floor(Math.random() * 1000) + 10
    const shares = Math.floor(Math.random() * 500) + 5
    const comments = Math.floor(Math.random() * 200) + 2
    
    const baseKey = `${category}_${source}_${platform}`
    const groupKey = `${category}_${source}_${platform}_${Math.floor(Math.random() * 1000)}`
    
    posts.push({
      postId: `post_${i + 1}`,
      postText: `Sample post about ${category.toLowerCase()} from ${source} on ${platform}. This is post number ${i + 1} with some engaging content.`,
      postDate,
      postLink: `https://example.com/post/${i + 1}`,
      platform,
      source,
      category,
      reactions,
      shares,
      comments,
      sentiment,
      featuredImagesPath: null,
      baseKey,
      groupKey,
      trendingScore: getRandomTrendingScore()
    })
  }
  
  return posts
}

// Generate sample news items
function generateSampleNewsItems(posts: any[]) {
  const newsItems: any[] = []
  const groupedPosts = new Map<string, any[]>()
  
  // Group posts by baseKey
  posts.forEach(post => {
    if (!groupedPosts.has(post.baseKey)) {
      groupedPosts.set(post.baseKey, [])
    }
    groupedPosts.get(post.baseKey)!.push(post)
  })
  
  groupedPosts.forEach((groupPosts, baseKey) => {
    const [category, source, platform] = baseKey.split('_')
    
    const totalReactions = groupPosts.reduce((sum, post) => sum + post.reactions, 0)
    const totalShares = groupPosts.reduce((sum, post) => sum + post.shares, 0)
    const totalComments = groupPosts.reduce((sum, post) => sum + post.comments, 0)
    const avgTrendingScore = groupPosts.reduce((sum, post) => sum + post.trendingScore, 0) / groupPosts.length
    
    const firstPostDate = new Date(Math.min(...groupPosts.map(p => p.postDate.getTime())))
    const lastPostDate = new Date(Math.max(...groupPosts.map(p => p.postDate.getTime())))
    
    newsItems.push({
      groupKey: baseKey,
      category,
      primarySource: source,
      primaryPlatform: platform,
      totalReactions,
      totalShares,
      totalComments,
      sourceCount: 1,
      platformCount: 1,
      postCount: groupPosts.length,
      avgTrendingScore,
      firstPostDate,
      lastPostDate,
      postAnalysisJson: JSON.stringify({
        sources: [source],
        platforms: [platform],
        sampleTexts: groupPosts.slice(0, 3).map(p => p.postText),
        postLinks: groupPosts.map(p => p.postLink).filter(Boolean),
        totalEngagement: totalReactions + totalShares + totalComments,
        sentimentBreakdown: {
          positive: groupPosts.filter(p => p.sentiment === "positive").length,
          neutral: groupPosts.filter(p => p.sentiment === "neutral").length,
          negative: groupPosts.filter(p => p.sentiment === "negative").length,
        },
      })
    })
  })
  
  return newsItems
}

// Generate daily aggregations
function generateDailyAggregations(posts: any[]) {
  const dailyData = new Map<string, any>()
  
  posts.forEach(post => {
    const dateKey = post.postDate.toISOString().split('T')[0]
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, {
        date: new Date(dateKey),
        totalPosts: 0,
        totalReactions: 0,
        totalShares: 0,
        totalComments: 0,
        avgTrendingScore: 0,
        posts: []
      })
    }
    
    const dayData = dailyData.get(dateKey)!
    dayData.totalPosts++
    dayData.totalReactions += post.reactions
    dayData.totalShares += post.shares
    dayData.totalComments += post.comments
    dayData.posts.push(post)
  })
  
  // Calculate averages and top sources
  dailyData.forEach(dayData => {
    dayData.avgTrendingScore = (dayData.posts as any[]).reduce((sum, post) => sum + post.trendingScore, 0) / (dayData.posts as any[]).length
    
    // Get top sources for this day
    const sourceCounts = new Map<string, number>()
    ;(dayData.posts as any[]).forEach(post => {
      sourceCounts.set(post.source, (sourceCounts.get(post.source) || 0) + 1)
    })
    const topSources = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }))
    
    dayData.topSources = JSON.stringify(topSources)
    delete dayData.posts // Remove posts array before saving
  })
  
  return Array.from(dailyData.values())
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await prisma.post.deleteMany()
    await prisma.newsItem.deleteMany()
    await prisma.dailyAgg.deleteMany()
    await prisma.dataIngestionLog.deleteMany()
    
    // Generate sample data
    console.log('📝 Generating sample posts...')
    const posts = generateSamplePosts(150) // Generate 150 sample posts
    
    console.log('📰 Generating sample news items...')
    const newsItems = generateSampleNewsItems(posts)
    
    console.log('📊 Generating daily aggregations...')
    const dailyAggs = generateDailyAggregations(posts)
    
    // Insert data into database
    console.log('💾 Inserting posts...')
    for (const post of posts) {
      await prisma.post.create({
        data: post
      })
    }
    
    console.log('💾 Inserting news items...')
    for (const newsItem of newsItems) {
      await prisma.newsItem.create({
        data: newsItem
      })
    }
    
    console.log('💾 Inserting daily aggregations...')
    for (const dailyAgg of dailyAggs) {
      await prisma.dailyAgg.create({
        data: dailyAgg
      })
    }
    
    // Create a data ingestion log
    await prisma.dataIngestionLog.create({
      data: {
        postsProcessed: posts.length,
        newsItemsCreated: newsItems.length,
        newsItemsUpdated: 0,
        status: 'SUCCESS',
        errorMessage: null
      }
    })
    
    console.log('✅ Database seeding completed successfully!')
    console.log(`📊 Created ${posts.length} posts, ${newsItems.length} news items, and ${dailyAggs.length} daily aggregations`)
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

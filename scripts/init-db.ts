import { PrismaClient } from '@prisma/client'
import cron from 'node-cron'
import axios from 'axios'

const prisma = new PrismaClient()

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check if tables exist by trying to query them
    const postCount = await prisma.post.count()
    const newsItemCount = await prisma.newsItem.count()
    
    console.log(`📊 Current data: ${postCount} posts, ${newsItemCount} news items`)
    
    // Start cron job for automatic data ingestion
    startCronJob()
    
    console.log('🚀 Database initialization completed successfully!')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

function startCronJob() {
  console.log('⏰ Starting cron job for automatic data ingestion...')
  
  // Schedule data ingestion every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("[CRON] Starting scheduled data ingestion...")
      
      const response = await axios.post(
        "http://localhost:3000/api/ingest",
        {},
        {
          timeout: 60000, // 1 minute timeout
        },
      )
      
      console.log("[CRON] Scheduled ingestion completed:", response.data)
    } catch (error) {
      console.error("[CRON] Scheduled ingestion failed:", error)
    }
  })
  
  console.log('✅ Cron job scheduled: Data ingestion every 10 minutes')
}

// Run initialization
initializeDatabase()
  .then(() => {
    console.log('🎉 Setup completed successfully!')
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

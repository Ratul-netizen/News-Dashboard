import { PrismaClient } from '@prisma/client'
import cron from 'node-cron'
import axios from 'axios'
import { initializeTokenService, getTokenService } from '../lib/services/token-refresh-service'
import { startTokenScheduler } from '../lib/services/token-scheduler'

const prisma = new PrismaClient()

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Initialize automatic token refresh system
    await initializeTokenRefreshSystem()
    
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

async function initializeTokenRefreshSystem() {
  try {
    console.log('🔐 Initializing automatic token refresh system...')
    
    const config = {
      authUrl: process.env.EXTERNAL_AUTH_URL || 'http://192.168.100.36:9053/auth/login',
      email: process.env.EXTERNAL_API_EMAIL || '',
      password: process.env.EXTERNAL_API_PASSWORD || '',
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      scope: process.env.OAUTH_SCOPE,
    }

    if (config.email && config.password) {
      // Initialize with database storage
      initializeTokenService(config, true, prisma)
      
      // Start background scheduler
      startTokenScheduler()
      
      // Test token service
      const tokenService = getTokenService()
      if (tokenService) {
        const token = await tokenService.getAccessToken()
        if (token) {
          console.log('✅ Automatic token refresh system initialized successfully')
          console.log('🔄 Token obtained automatically - no manual intervention needed!')
        } else {
          console.warn('⚠️ Token service initialized but failed to get initial token')
        }
      }
    } else {
      console.warn('⚠️ Token service not initialized - missing credentials')
      console.log('💡 Set EXTERNAL_API_EMAIL and EXTERNAL_API_PASSWORD to enable automatic token refresh')
    }
  } catch (error) {
    console.error('❌ Token refresh system initialization failed:', error)
    console.log('🔄 Continuing without automatic token refresh...')
  }
}

function startCronJob() {
  console.log('⏰ Starting cron job for automatic data ingestion...')
  
  // Schedule data ingestion every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("[CRON] Starting scheduled data ingestion...")
      
      // Use token service for authenticated requests if available
      const tokenService = getTokenService()
      let headers = {}
      
      if (tokenService) {
        try {
          headers = await tokenService.getAuthHeaders()
          console.log("[CRON] Using automatic token authentication")
        } catch (error) {
          console.warn("[CRON] Token service unavailable, proceeding without auth:", error)
        }
      }
      
      const response = await axios.post(
        "http://localhost:3000/api/ingest",
        {},
        {
          timeout: 60000, // 1 minute timeout
          headers,
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

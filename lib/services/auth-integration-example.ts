// Example: How to integrate automatic token refresh into your existing application

import { initializeTokenService, getTokenService } from '@/lib/services/token-refresh-service'
import { startTokenScheduler } from '@/lib/services/token-scheduler'
import { prisma } from '@/lib/db'

// Initialize the token service on application startup
export function initializeAuth() {
  const config = {
    authUrl: process.env.EXTERNAL_AUTH_URL || 'http://192.168.100.35:9055/api/login/',
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
    
    console.log('✅ Automatic token refresh system initialized')
  } else {
    console.warn('⚠️ Token service not initialized - missing credentials')
  }
}

// Example: Using the token service in your existing API routes
export async function makeAuthenticatedRequest(url: string) {
  const tokenService = getTokenService()
  
  if (!tokenService) {
    throw new Error('Token service not initialized')
  }

  const headers = await tokenService.getAuthHeaders()
  
  const response = await fetch(url, { headers })
  
  if (response.status === 401) {
    // Token might be expired, try to refresh
    console.log('401 error, attempting token refresh...')
    const newHeaders = await tokenService.getAuthHeaders()
    return await fetch(url, { headers: newHeaders })
  }
  
  return response
}

// Example: Replace your existing authentication logic
export async function getExternalApiAuthHeaders(): Promise<Record<string, string>> {
  const tokenService = getTokenService()
  
  if (!tokenService) {
    // Fallback to static token if available
    const staticToken = process.env.EXTERNAL_API_TOKEN
    if (staticToken) {
      return { Authorization: `Bearer ${staticToken}` }
    }
    return {}
  }

  return await tokenService.getAuthHeaders()
}

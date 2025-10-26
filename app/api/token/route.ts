import { NextRequest, NextResponse } from 'next/server'
import { initializeTokenService, getTokenService, destroyTokenService } from '../../../lib/services/token-refresh-service'

// Initialize token service on startup
let isInitialized = false

function initializeService() {
  if (isInitialized) return

  const config = {
    authUrl: process.env.EXTERNAL_AUTH_URL || 'http://192.168.100.35:9055/api/login/',
    email: process.env.EXTERNAL_API_EMAIL || '',
    password: process.env.EXTERNAL_API_PASSWORD || '',
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    scope: process.env.OAUTH_SCOPE,
  }

  if (config.email && config.password) {
    initializeTokenService(config)
    isInitialized = true
    console.log('[TokenAPI] Token service initialized')
  } else {
    console.warn('[TokenAPI] Token service not initialized - missing credentials')
  }
}

// GET /api/token/status - Get current token status
export async function GET(request: NextRequest) {
  try {
    initializeService()
    
    const tokenService = getTokenService()
    if (!tokenService) {
      return NextResponse.json({
        success: false,
        error: 'Token service not initialized'
      }, { status: 500 })
    }

    const status = tokenService.getTokenStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        expiresAt: status.expiresAt?.toISOString() || null,
        timeUntilExpirySeconds: status.timeUntilExpiry ? Math.round(status.timeUntilExpiry / 1000) : null
      }
    })

  } catch (error) {
    console.error('[TokenAPI] Error getting token status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/token/refresh - Force token refresh
export async function POST(request: NextRequest) {
  try {
    initializeService()
    
    const tokenService = getTokenService()
    if (!tokenService) {
      return NextResponse.json({
        success: false,
        error: 'Token service not initialized'
      }, { status: 500 })
    }

    console.log('[TokenAPI] Force refreshing token...')
    const token = await tokenService.forceRefresh()
    
    if (token) {
      const status = tokenService.getTokenStatus()
      return NextResponse.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          ...status,
          expiresAt: status.expiresAt?.toISOString() || null,
          timeUntilExpirySeconds: status.timeUntilExpiry ? Math.round(status.timeUntilExpiry / 1000) : null
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Token refresh failed'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('[TokenAPI] Error refreshing token:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/token - Clear token cache
export async function DELETE(request: NextRequest) {
  try {
    console.log('[TokenAPI] Clearing token cache...')
    destroyTokenService()
    isInitialized = false
    
    return NextResponse.json({
      success: true,
      message: 'Token cache cleared'
    })

  } catch (error) {
    console.error('[TokenAPI] Error clearing token cache:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

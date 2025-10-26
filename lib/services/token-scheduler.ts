import { getTokenService } from './token-refresh-service'

export class TokenRefreshScheduler {
  private refreshInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private readonly REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private consecutiveFailures = 0
  private readonly MAX_FAILURES = 3

  constructor() {
    this.startScheduledRefresh()
    this.startHealthMonitoring()
  }

  /**
   * Start scheduled token refresh
   */
  private startScheduledRefresh(): void {
    console.log('[TokenScheduler] Starting scheduled token refresh...')
    
    this.refreshInterval = setInterval(async () => {
      try {
        const tokenService = getTokenService()
        if (!tokenService) {
          console.log('[TokenScheduler] No token service available, skipping refresh')
          return
        }

        const status = tokenService.getTokenStatus()
        
        // Only refresh if token is close to expiry or invalid
        if (!status.isValid || (status.timeUntilExpiry && status.timeUntilExpiry < 15 * 60 * 1000)) {
          console.log('[TokenScheduler] Token needs refresh, performing scheduled refresh...')
          const token = await tokenService.getAccessToken()
          
          if (token) {
            console.log('[TokenScheduler] ✅ Scheduled refresh successful')
            this.consecutiveFailures = 0
          } else {
            console.warn('[TokenScheduler] ❌ Scheduled refresh failed')
            this.consecutiveFailures++
          }
        } else {
          console.log('[TokenScheduler] Token is still valid, skipping refresh')
        }
      } catch (error) {
        console.error('[TokenScheduler] Error during scheduled refresh:', error)
        this.consecutiveFailures++
      }
    }, this.REFRESH_INTERVAL)
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    console.log('[TokenScheduler] Starting token health monitoring...')
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const tokenService = getTokenService()
        if (!tokenService) {
          console.log('[TokenScheduler] No token service available for health check')
          return
        }

        const status = tokenService.getTokenStatus()
        
        if (!status.hasToken) {
          console.warn('[TokenScheduler] ⚠️ No token available')
          this.consecutiveFailures++
        } else if (!status.isValid) {
          console.warn('[TokenScheduler] ⚠️ Token is invalid')
          this.consecutiveFailures++
        } else {
          console.log(`[TokenScheduler] ✅ Token health OK - expires in ${Math.round((status.timeUntilExpiry || 0) / 1000)}s`)
          this.consecutiveFailures = 0
        }

        // If we have too many consecutive failures, try to recover
        if (this.consecutiveFailures >= this.MAX_FAILURES) {
          console.warn('[TokenScheduler] Too many consecutive failures, attempting recovery...')
          try {
            const token = await tokenService.forceRefresh()
            if (token) {
              console.log('[TokenScheduler] ✅ Recovery successful')
              this.consecutiveFailures = 0
            } else {
              console.error('[TokenScheduler] ❌ Recovery failed')
            }
          } catch (error) {
            console.error('[TokenScheduler] Recovery error:', error)
          }
        }
      } catch (error) {
        console.error('[TokenScheduler] Health check error:', error)
        this.consecutiveFailures++
      }
    }, this.HEALTH_CHECK_INTERVAL)
  }

  /**
   * Stop scheduled refresh
   */
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      console.log('[TokenScheduler] Scheduled refresh stopped')
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      console.log('[TokenScheduler] Health monitoring stopped')
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean
    consecutiveFailures: number
    refreshIntervalMs: number
    healthCheckIntervalMs: number
  } {
    return {
      isRunning: this.refreshInterval !== null,
      consecutiveFailures: this.consecutiveFailures,
      refreshIntervalMs: this.REFRESH_INTERVAL,
      healthCheckIntervalMs: this.HEALTH_CHECK_INTERVAL
    }
  }

  /**
   * Force immediate refresh
   */
  async forceRefresh(): Promise<boolean> {
    try {
      const tokenService = getTokenService()
      if (!tokenService) {
        console.log('[TokenScheduler] No token service available for force refresh')
        return false
      }

      console.log('[TokenScheduler] Performing forced refresh...')
      const token = await tokenService.forceRefresh()
      
      if (token) {
        console.log('[TokenScheduler] ✅ Force refresh successful')
        this.consecutiveFailures = 0
        return true
      } else {
        console.warn('[TokenScheduler] ❌ Force refresh failed')
        this.consecutiveFailures++
        return false
      }
    } catch (error) {
      console.error('[TokenScheduler] Force refresh error:', error)
      this.consecutiveFailures++
      return false
    }
  }
}

// Singleton instance
let scheduler: TokenRefreshScheduler | null = null

export function startTokenScheduler(): TokenRefreshScheduler {
  if (scheduler) {
    scheduler.stop()
  }
  
  scheduler = new TokenRefreshScheduler()
  return scheduler
}

export function stopTokenScheduler(): void {
  if (scheduler) {
    scheduler.stop()
    scheduler = null
  }
}

export function getTokenScheduler(): TokenRefreshScheduler | null {
  return scheduler
}

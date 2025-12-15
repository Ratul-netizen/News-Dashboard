import axios from 'axios'
import { PersistentTokenStorage, DatabaseTokenStorage } from './token-storage'

export interface TokenData {
  token: string
  expiresAt: number
  refreshToken?: string
  tokenType: string
}

interface AuthConfig {
  authUrl: string
  email: string
  password: string
  clientId?: string
  clientSecret?: string
  scope?: string
}

export class TokenRefreshService {
  private tokenData: TokenData | null = null
  private refreshPromise: Promise<string | null> | null = null
  private lastRefreshAttempt: number = 0
  private readonly REFRESH_COOLDOWN = 30000 // 30 seconds
  private readonly REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes before expiry
  private refreshTimer: NodeJS.Timeout | null = null
  private storage: PersistentTokenStorage | DatabaseTokenStorage | null = null

  constructor(private config: AuthConfig, useDatabase: boolean = false, prisma?: any) {
    if (useDatabase && prisma) {
      this.storage = new DatabaseTokenStorage(prisma)
    } else {
      this.storage = new PersistentTokenStorage()
    }

    // Try to load existing token on startup
    this.loadStoredToken()
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string | null> {
    // If we have a valid token, return it
    if (this.isTokenValid()) {
      return this.tokenData!.token
    }

    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return await this.refreshPromise
    }

    // Start refresh process
    this.refreshPromise = this.performRefresh()
    const token = await this.refreshPromise
    this.refreshPromise = null

    return token
  }

  /**
   * Force a fresh token refresh
   */
  async forceRefresh(): Promise<string | null> {
    console.log('[TokenRefresh] Force refreshing token...')
    this.tokenData = null
    this.refreshPromise = null

    // Clear stored token
    if (this.storage) {
      try {
        await this.storage.clearStoredToken()
      } catch (error) {
        console.error('[TokenRefresh] Error clearing stored token:', error)
      }
    }

    return await this.getAccessToken()
  }

  /**
   * Check if current token is valid and not expired
   */
  private isTokenValid(tokenData?: TokenData): boolean {
    const data = tokenData || this.tokenData
    if (!data) return false

    const now = Date.now()
    const expiresAt = data.expiresAt

    // Token is valid if it hasn't expired and won't expire in the next 5 minutes
    return now < (expiresAt - this.REFRESH_BUFFER)
  }

  /**
   * Perform token refresh with multiple strategies
   */
  private async performRefresh(): Promise<string | null> {
    const now = Date.now()

    // Rate limiting
    if (now - this.lastRefreshAttempt < this.REFRESH_COOLDOWN) {
      console.log('[TokenRefresh] Rate limited, waiting...')
      await new Promise(resolve => setTimeout(resolve, this.REFRESH_COOLDOWN - (now - this.lastRefreshAttempt)))
    }

    this.lastRefreshAttempt = now

    try {
      console.log('[TokenRefresh] Attempting token refresh...')

      // Strategy 1: Try configured auth URL and explicit refresh endpoint
      const explicitRefreshUrl = "http://192.168.100.36:9055/api/token/refresh";

      const endpointsToTry = [
        explicitRefreshUrl,
        this.config.authUrl,
      ].filter(url => url && url.startsWith('http'));

      for (const url of endpointsToTry) {
        let token = await this.tryAuthEndpoint(url);
        if (token) {
          this.scheduleNextRefresh();
          return token;
        }
      }

      // Strategy 2: Derive common endpoints if initial attempts fail
      if (this.config.authUrl && this.config.authUrl.startsWith('http')) {
        const baseUrl = this.config.authUrl.split('/api')[0] || this.config.authUrl.split('/auth')[0]
        const oauthEndpoints = [
          `${baseUrl}/oauth/token`,
          `${baseUrl}/api/oauth/token`,
          `${baseUrl}/auth/oauth/token`,
          `${baseUrl}/api/auth/token`,
          `${baseUrl}/api/login`,
          `${baseUrl}/api/auth/login`,
          `${baseUrl}/api/token`,
          `${baseUrl}/api/authenticate`,
        ]

        for (const endpoint of oauthEndpoints) {
          let token = await this.tryAuthEndpoint(endpoint)
          if (token) {
            this.scheduleNextRefresh()
            return token
          }
        }
      }

      // Strategy 3: Try OAuth2 client credentials flow
      if (this.config.clientId && this.config.clientSecret) {
        let token = await this.tryOAuth2ClientCredentials()
        if (token) {
          this.scheduleNextRefresh()
          return token
        }
      }

      console.error('[TokenRefresh] All authentication strategies failed')
      return null

    } catch (error) {
      console.error('[TokenRefresh] Token refresh error:', error)
      return null
    }
  }

  /**
   * Try authentication with a specific endpoint
   */
  private async tryAuthEndpoint(endpoint: string): Promise<string | null> {
    try {
      console.log(`[TokenRefresh] Trying endpoint: ${endpoint}`)

      // Try different request formats
      const authFormats = [
        // Standard email/password
        { email: this.config.email, password: this.config.password },
        // Username/password
        { username: this.config.email, password: this.config.password },
        // User/pass
        { user: this.config.email, pass: this.config.password },
        // Login/password
        { login: this.config.email, password: this.config.password },
      ]

      for (const authData of authFormats) {
        try {
          const response = await axios.post(endpoint, authData, {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          })

          const token = this.extractTokenFromResponse(response.data, response.headers)
          if (token) {
            console.log(`[TokenRefresh] ✅ Success with endpoint: ${endpoint}`)
            this.storeToken(token)
            return token
          }
        } catch (error: any) {
          console.log(`[TokenRefresh] ❌ Format failed for ${endpoint}:`, error.response?.status || error.message)
          continue
        }
      }

      // Try form-encoded credentials
      try {
        const form = new URLSearchParams()
        form.append('username', this.config.email)
        form.append('password', this.config.password)

        const response = await axios.post(endpoint, form.toString(), {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          }
        })

        const token = this.extractTokenFromResponse(response.data, response.headers)
        if (token) {
          console.log(`[TokenRefresh] ✅ Form-encoded success with endpoint: ${endpoint}`)
          this.storeToken(token)
          return token
        }
      } catch (error: any) {
        console.log(`[TokenRefresh] ❌ Form-encoded failed for ${endpoint}:`, error.response?.status || error.message)
      }

      return null

    } catch (error: any) {
      console.log(`[TokenRefresh] ❌ Endpoint ${endpoint} failed:`, error.response?.status || error.message)
      return null
    }
  }

  /**
   * Try OAuth2 client credentials flow
   */
  private async tryOAuth2ClientCredentials(): Promise<string | null> {
    try {
      console.log('[TokenRefresh] Trying OAuth2 client credentials flow...')

      const form = new URLSearchParams()
      form.append('grant_type', 'client_credentials')
      form.append('client_id', this.config.clientId!)
      form.append('client_secret', this.config.clientSecret!)
      if (this.config.scope) {
        form.append('scope', this.config.scope)
      }

      const response = await axios.post(this.config.authUrl, form.toString(), {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        }
      })

      const token = this.extractTokenFromResponse(response.data, response.headers)
      if (token) {
        console.log('[TokenRefresh] ✅ OAuth2 client credentials success')
        this.storeToken(token)
        return token
      }

      return null

    } catch (error: any) {
      console.log('[TokenRefresh] ❌ OAuth2 client credentials failed:', error.response?.status || error.message)
      return null
    }
  }

  /**
   * Extract token from API response
   */
  private extractTokenFromResponse(data: any, headers?: any): string | null {
    try {
      // Direct token fields
      const direct = data?.access_token || data?.access || data?.token || data?.auth_token || data?.key || data?.jwt
      if (direct) return String(direct)

      // Nested token containers
      if (data?.token?.access_token) return String(data.token.access_token)
      if (data?.data?.token?.access_token) return String(data.data.token.access_token)
      if (data?.token?.access) return String(data.token.access)
      if (data?.data?.token?.access) return String(data.data.token.access)

      // Authorization header
      const authHeader = headers?.authorization || headers?.Authorization
      if (authHeader && String(authHeader).toLowerCase().startsWith('bearer ')) {
        return String(authHeader).slice(7).trim()
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Load stored token on startup
   */
  private async loadStoredToken(): Promise<void> {
    if (!this.storage) return

    try {
      const storedToken = await this.storage.getStoredToken()
      if (storedToken && this.isTokenValid(storedToken)) {
        this.tokenData = storedToken
        console.log(`[TokenRefresh] Loaded stored token, expires at: ${new Date(storedToken.expiresAt).toISOString()}`)
        this.scheduleNextRefresh()
      }
    } catch (error) {
      console.error('[TokenRefresh] Error loading stored token:', error)
    }
  }

  /**
   * Store token and calculate expiry
   */
  private async storeToken(token: string): Promise<void> {
    const expiresAt = this.parseTokenExpiry(token) || (Date.now() + 3600000) // Default 1 hour

    this.tokenData = {
      token,
      expiresAt,
      tokenType: 'Bearer'
    }

    // Store persistently
    if (this.storage) {
      try {
        await this.storage.storeToken(this.tokenData)
      } catch (error) {
        console.error('[TokenRefresh] Error storing token persistently:', error)
      }
    }

    console.log(`[TokenRefresh] Token stored, expires at: ${new Date(expiresAt).toISOString()}`)
  }

  /**
   * Parse JWT token to get expiry time
   */
  private parseTokenExpiry(token: string): number | null {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      return payload.exp ? payload.exp * 1000 : null // Convert to milliseconds
    } catch {
      return null
    }
  }

  /**
   * Schedule next refresh before token expires
   */
  private scheduleNextRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    if (!this.tokenData) return

    const refreshTime = this.tokenData.expiresAt - this.REFRESH_BUFFER - Date.now()

    if (refreshTime > 0) {
      console.log(`[TokenRefresh] Scheduling refresh in ${Math.round(refreshTime / 1000)} seconds`)

      this.refreshTimer = setTimeout(async () => {
        console.log('[TokenRefresh] Scheduled refresh triggered')
        await this.getAccessToken()
      }, refreshTime)
    }
  }

  /**
   * Get authorization headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken()

    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }

    return {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    this.tokenData = null
    this.refreshPromise = null
  }

  /**
   * Get token status for monitoring
   */
  getTokenStatus(): {
    hasToken: boolean
    isValid: boolean
    expiresAt: Date | null
    timeUntilExpiry: number | null
  } {
    if (!this.tokenData) {
      return {
        hasToken: false,
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null
      }
    }

    const now = Date.now()
    const expiresAt = new Date(this.tokenData.expiresAt)
    const timeUntilExpiry = this.tokenData.expiresAt - now

    return {
      hasToken: true,
      isValid: this.isTokenValid(),
      expiresAt,
      timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : 0
    }
  }
}

// Singleton instance for the application
declare global {
  var tokenService: TokenRefreshService | null
}

export function getTokenService(): TokenRefreshService | null {
  return global.tokenService || null
}

export function initializeTokenService(config: AuthConfig, useDatabase: boolean = false, prisma?: any): TokenRefreshService {
  if (global.tokenService) {
    global.tokenService.destroy()
  }

  global.tokenService = new TokenRefreshService(config, useDatabase, prisma)
  return global.tokenService
}

export function destroyTokenService(): void {
  if (global.tokenService) {
    global.tokenService.destroy()
    global.tokenService = null
  }
}

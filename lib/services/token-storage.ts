import fs from 'fs/promises'
import path from 'path'
import { TokenData } from './token-refresh-service'

interface StoredTokenData extends TokenData {
  createdAt: number
  lastUsed: number
}

export class PersistentTokenStorage {
  private readonly storagePath: string
  private readonly maxAge: number = 24 * 60 * 60 * 1000 // 24 hours

  constructor(storageDir: string = './data') {
    this.storagePath = path.join(storageDir, 'token-cache.json')
  }

  /**
   * Store token data persistently
   */
  async storeToken(tokenData: TokenData): Promise<void> {
    try {
      const storedData: StoredTokenData = {
        ...tokenData,
        createdAt: Date.now(),
        lastUsed: Date.now()
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(this.storagePath), { recursive: true })
      
      await fs.writeFile(this.storagePath, JSON.stringify(storedData, null, 2))
      console.log('[TokenStorage] Token stored persistently')
    } catch (error) {
      console.error('[TokenStorage] Error storing token:', error)
    }
  }

  /**
   * Retrieve stored token data
   */
  async getStoredToken(): Promise<TokenData | null> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8')
      const storedData: StoredTokenData = JSON.parse(data)

      // Check if token is still valid and not too old
      const now = Date.now()
      const age = now - storedData.createdAt
      
      if (age > this.maxAge) {
        console.log('[TokenStorage] Stored token is too old, ignoring')
        await this.clearStoredToken()
        return null
      }

      // Check if token hasn't expired
      if (now >= storedData.expiresAt) {
        console.log('[TokenStorage] Stored token has expired, ignoring')
        await this.clearStoredToken()
        return null
      }

      // Update last used timestamp
      storedData.lastUsed = now
      await fs.writeFile(this.storagePath, JSON.stringify(storedData, null, 2))

      console.log('[TokenStorage] Retrieved valid stored token')
      return {
        token: storedData.token,
        expiresAt: storedData.expiresAt,
        refreshToken: storedData.refreshToken,
        tokenType: storedData.tokenType
      }

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('[TokenStorage] No stored token found')
        return null
      }
      console.error('[TokenStorage] Error retrieving token:', error)
      return null
    }
  }

  /**
   * Clear stored token data
   */
  async clearStoredToken(): Promise<void> {
    try {
      await fs.unlink(this.storagePath)
      console.log('[TokenStorage] Stored token cleared')
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('[TokenStorage] Error clearing token:', error)
      }
    }
  }

  /**
   * Get storage status
   */
  async getStorageStatus(): Promise<{
    hasStoredToken: boolean
    tokenAge: number | null
    lastUsed: Date | null
    isValid: boolean
  }> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8')
      const storedData: StoredTokenData = JSON.parse(data)
      
      const now = Date.now()
      const age = now - storedData.createdAt
      const isValid = now < storedData.expiresAt && age <= this.maxAge

      return {
        hasStoredToken: true,
        tokenAge: age,
        lastUsed: new Date(storedData.lastUsed),
        isValid
      }
    } catch (error) {
      return {
        hasStoredToken: false,
        tokenAge: null,
        lastUsed: null,
        isValid: false
      }
    }
  }
}

// Database-based token storage using Prisma
export class DatabaseTokenStorage {
  constructor(private prisma: any) {}

  /**
   * Store token in database
   */
  async storeToken(tokenData: TokenData): Promise<void> {
    try {
      await this.prisma.tokenCache.upsert({
        where: { service: 'external_api' },
        create: {
          service: 'external_api',
          token: tokenData.token,
          expiresAt: new Date(tokenData.expiresAt),
          refreshToken: tokenData.refreshToken,
          tokenType: tokenData.tokenType,
          createdAt: new Date(),
          lastUsed: new Date()
        },
        update: {
          token: tokenData.token,
          expiresAt: new Date(tokenData.expiresAt),
          refreshToken: tokenData.refreshToken,
          tokenType: tokenData.tokenType,
          lastUsed: new Date()
        }
      })
      console.log('[TokenStorage] Token stored in database')
    } catch (error) {
      console.error('[TokenStorage] Error storing token in database:', error)
    }
  }

  /**
   * Retrieve token from database
   */
  async getStoredToken(): Promise<TokenData | null> {
    try {
      const stored = await this.prisma.tokenCache.findUnique({
        where: { service: 'external_api' }
      })

      if (!stored) {
        console.log('[TokenStorage] No stored token found in database')
        return null
      }

      const now = Date.now()
      const expiresAt = stored.expiresAt.getTime()

      // Check if token has expired
      if (now >= expiresAt) {
        console.log('[TokenStorage] Stored token has expired, clearing')
        await this.clearStoredToken()
        return null
      }

      // Update last used timestamp
      await this.prisma.tokenCache.update({
        where: { service: 'external_api' },
        data: { lastUsed: new Date() }
      })

      console.log('[TokenStorage] Retrieved valid stored token from database')
      return {
        token: stored.token,
        expiresAt: expiresAt,
        refreshToken: stored.refreshToken,
        tokenType: stored.tokenType
      }

    } catch (error) {
      console.error('[TokenStorage] Error retrieving token from database:', error)
      return null
    }
  }

  /**
   * Clear stored token from database
   */
  async clearStoredToken(): Promise<void> {
    try {
      await this.prisma.tokenCache.deleteMany({
        where: { service: 'external_api' }
      })
      console.log('[TokenStorage] Stored token cleared from database')
    } catch (error) {
      console.error('[TokenStorage] Error clearing token from database:', error)
    }
  }

  /**
   * Get storage status from database
   */
  async getStorageStatus(): Promise<{
    hasStoredToken: boolean
    tokenAge: number | null
    lastUsed: Date | null
    isValid: boolean
  }> {
    try {
      const stored = await this.prisma.tokenCache.findUnique({
        where: { service: 'external_api' }
      })

      if (!stored) {
        return {
          hasStoredToken: false,
          tokenAge: null,
          lastUsed: null,
          isValid: false
        }
      }

      const now = Date.now()
      const createdAt = stored.createdAt.getTime()
      const expiresAt = stored.expiresAt.getTime()
      const age = now - createdAt
      const isValid = now < expiresAt

      return {
        hasStoredToken: true,
        tokenAge: age,
        lastUsed: stored.lastUsed,
        isValid
      }
    } catch (error) {
      console.error('[TokenStorage] Error getting storage status:', error)
      return {
        hasStoredToken: false,
        tokenAge: null,
        lastUsed: null,
        isValid: false
      }
    }
  }
}

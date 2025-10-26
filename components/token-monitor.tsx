'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface TokenStatus {
  hasToken: boolean
  isValid: boolean
  expiresAt: string | null
  timeUntilExpirySeconds: number | null
}

interface SchedulerStatus {
  isRunning: boolean
  consecutiveFailures: number
  refreshIntervalMs: number
  healthCheckIntervalMs: number
}

export function TokenMonitor() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/token/status')
      const data = await response.json()
      
      if (data.success) {
        setTokenStatus(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch token status')
      }
    } catch (err) {
      setError('Network error while fetching token status')
    }
  }

  const forceRefresh = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/token/refresh', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setTokenStatus(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to refresh token')
      }
    } catch (err) {
      setError('Network error while refreshing token')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCache = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/token', { method: 'DELETE' })
      const data = await response.json()
      
      if (data.success) {
        await fetchStatus()
        setError(null)
      } else {
        setError(data.error || 'Failed to clear token cache')
      }
    } catch (err) {
      setError('Network error while clearing token cache')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const formatTimeRemaining = (seconds: number | null): string => {
    if (!seconds) return 'Unknown'
    
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const getStatusBadge = () => {
    if (!tokenStatus) return <Badge variant="secondary">Unknown</Badge>
    
    if (!tokenStatus.hasToken) {
      return <Badge variant="destructive">No Token</Badge>
    }
    
    if (!tokenStatus.isValid) {
      return <Badge variant="destructive">Invalid</Badge>
    }
    
    if (tokenStatus.timeUntilExpirySeconds && tokenStatus.timeUntilExpirySeconds < 300) {
      return <Badge variant="secondary">Expiring Soon</Badge>
    }
    
    return <Badge variant="default">Valid</Badge>
  }

  const getStatusIcon = () => {
    if (!tokenStatus) return <AlertTriangle className="h-4 w-4 text-gray-500" />
    
    if (!tokenStatus.hasToken || !tokenStatus.isValid) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    
    if (tokenStatus.timeUntilExpirySeconds && tokenStatus.timeUntilExpirySeconds < 300) {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Token Status
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Monitor external API authentication token health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {tokenStatus && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Has Token:</span>
                <span className={`ml-2 ${tokenStatus.hasToken ? 'text-green-600' : 'text-red-600'}`}>
                  {tokenStatus.hasToken ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Is Valid:</span>
                <span className={`ml-2 ${tokenStatus.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {tokenStatus.isValid ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Expires At:</span>
                <span className="ml-2">
                  {tokenStatus.expiresAt ? new Date(tokenStatus.expiresAt).toLocaleString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-medium">Time Remaining:</span>
                <span className="ml-2">
                  {formatTimeRemaining(tokenStatus.timeUntilExpirySeconds)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={forceRefresh} 
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Force Refresh
            </Button>
            <Button 
              onClick={clearCache} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Clear Cache
            </Button>
            <Button 
              onClick={fetchStatus} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {schedulerStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduler Status</CardTitle>
            <CardDescription>
              Background token refresh and health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant={schedulerStatus.isRunning ? "default" : "secondary"} className="ml-2">
                  {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Consecutive Failures:</span>
                <span className={`ml-2 ${schedulerStatus.consecutiveFailures > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {schedulerStatus.consecutiveFailures}
                </span>
              </div>
              <div>
                <span className="font-medium">Refresh Interval:</span>
                <span className="ml-2">{Math.round(schedulerStatus.refreshIntervalMs / 60000)}m</span>
              </div>
              <div>
                <span className="font-medium">Health Check Interval:</span>
                <span className="ml-2">{Math.round(schedulerStatus.healthCheckIntervalMs / 60000)}m</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  credentials: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    credentials: null
  })

  useEffect(() => {
    // Check if credentials exist in sessionStorage
    const storedCredentials = sessionStorage.getItem('authCredentials')
    
    if (storedCredentials) {
      // Set as authenticated immediately to prevent redirect loops
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        credentials: storedCredentials
      })
      
      // Then verify credentials in the background
      verifyCredentials(storedCredentials)
    } else {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        credentials: null
      })
    }
  }, [])

  const verifyCredentials = async (credentials: string) => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          credentials
        })
      } else {
        // Credentials are invalid, clear them
        sessionStorage.removeItem('authCredentials')
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          credentials: null
        })
      }
    } catch (error) {
      console.error('Auth verification failed:', error)
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        credentials: null
      })
    }
  }

  const login = (credentials: string) => {
    sessionStorage.setItem('authCredentials', credentials)
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      credentials
    })
  }

  const logout = () => {
    sessionStorage.removeItem('authCredentials')
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      credentials: null
    })
    // Redirect to login page after logout
    window.location.href = '/login'
  }

  const getAuthHeaders = () => {
    if (authState.credentials) {
      return {
        'Authorization': `Basic ${authState.credentials}`,
        'Content-Type': 'application/json',
      }
    }
    return {
      'Content-Type': 'application/json',
    }
  }

  return {
    ...authState,
    login,
    logout,
    getAuthHeaders
  }
}

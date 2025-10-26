"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        // Check if credentials exist in sessionStorage
        const storedCredentials = sessionStorage.getItem('authCredentials')
        
        if (storedCredentials) {
          // Verify credentials are still valid
          const response = await fetch('/api/auth/check', {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${storedCredentials}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          })
          
          if (response.ok) {
            router.push('/')
          } else {
            // Credentials are invalid, clear them
            sessionStorage.removeItem('authCredentials')
          }
        }
      } catch (error) {
        // User is not authenticated, stay on login page
        console.log('Auth check failed:', error)
      }
    }
    
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Create basic auth header
      const credentials = btoa(`${username}:${password}`)
      
      // Test authentication by making a request to a protected endpoint
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        // Store credentials in sessionStorage for subsequent requests
        sessionStorage.setItem('authCredentials', credentials)
        router.push('/')
      } else if (response.status === 401) {
        setError("Invalid username or password")
      } else {
        setError("Authentication failed. Please try again.")
      }
    } catch (error) {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">News Dashboard</h2>
          <p className="text-gray-400">Please sign in to continue</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-md p-3">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

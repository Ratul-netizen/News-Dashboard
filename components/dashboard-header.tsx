"use client"

import type React from "react"

import { useState } from "react"
import { Search, RefreshCw, BarChart3, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DashboardHeaderProps {
  onManualRefresh: () => void
  onSearch: (query: string) => void
  searchQuery: string
  onLogout?: () => void
}

export function DashboardHeader({ onManualRefresh, onSearch, searchQuery, onLogout }: DashboardHeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(localSearchQuery)
  }

  const handleClearSearch = () => {
    setLocalSearchQuery("")
    onSearch("")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F] border-b border-gray-800">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">News Analysis Dashboard</h1>
            </div>
          </div>

          {/* Right side - Search and Refresh */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search posts or sources..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 pr-10 w-80 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
              {localSearchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </form>

            <Button
              onClick={onManualRefresh}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Manual Refresh
            </Button>

            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-red-700 text-red-300 hover:bg-red-800 hover:text-white bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

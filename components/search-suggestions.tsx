"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Clock } from "lucide-react"

interface SearchSuggestionsProps {
  onSelect: (query: string) => void
  trigger: React.ReactNode
}

export function SearchSuggestions({ onSelect, trigger }: SearchSuggestionsProps) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("dashboard-recent-searches")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading recent searches:", error)
      }
    }
  }, [])

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return

    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("dashboard-recent-searches", JSON.stringify(updated))
  }

  const handleSelect = (query: string) => {
    saveRecentSearch(query)
    onSelect(query)
    setOpen(false)
  }

  const popularSearches = [
    "Politics",
    "Business",
    "Technology",
    "Sports",
    "Entertainment",
    "Health",
    "Science",
    "World News",
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-gray-800 border-gray-700" align="start">
        <Command className="bg-gray-800">
          <CommandInput placeholder="Search posts, sources, categories..." className="text-white" />
          <CommandList>
            <CommandEmpty>No suggestions found.</CommandEmpty>

            {recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((search) => (
                  <CommandItem
                    key={search}
                    onSelect={() => handleSelect(search)}
                    className="text-gray-300 hover:bg-gray-700"
                  >
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    {search}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Popular Searches">
              {popularSearches.map((search) => (
                <CommandItem
                  key={search}
                  onSelect={() => handleSelect(search)}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  <Search className="mr-2 h-4 w-4 text-gray-500" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

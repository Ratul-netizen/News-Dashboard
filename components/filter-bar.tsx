"use client"

import { useState } from "react"
import { Calendar, CalendarDays, Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { DashboardFilters } from "@/lib/types"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"

interface FilterBarProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
  filterOptions: {
    categories: string[]
    sources: string[]
    platforms: string[]
  }
  onRefresh: () => void
  isRefreshing?: boolean
}

export function FilterBar({ filters, onFiltersChange, filterOptions, onRefresh, isRefreshing = false }: FilterBarProps) {
  // Use filters.dateRange directly instead of local state to avoid sync issues
  const dateRange = filters.dateRange

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    onFiltersChange({ ...filters, dateRange: range })
  }

  const handleMultiSelectChange = (field: "categories" | "sources" | "platforms", value: string, checked: boolean) => {
    const currentValues = filters[field]
    const newValues = checked ? [...currentValues, value] : currentValues.filter((v) => v !== value)

    onFiltersChange({ ...filters, [field]: newValues })
  }

  const clearFilters = () => {
    const clearedFilters: DashboardFilters = {
      dateRange: {
        from: dayjs().subtract(7, "days").toDate(),
        to: new Date(),
      },
      categories: [],
      sources: [],
      platforms: [],
    }
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="sticky top-[73px] z-40 bg-[#1A1A1A] border-b border-gray-800 mt-[73px]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                    !dateRange && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {dayjs(dateRange.from).format("MMM DD, YYYY")} - {dayjs(dateRange.to).format("MMM DD, YYYY")}
                      </>
                    ) : (
                      dayjs(dateRange.from).format("MMM DD, YYYY")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      // Handle partial selection - if only from date is selected, use it as both from and to
                      const toDate = range.to || range.from
                      handleDateRangeChange({ from: range.from, to: toDate })
                    }
                  }}
                  numberOfMonths={2}
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Category Filter */}
          <MultiSelectFilter
            label="Categories"
            options={filterOptions.categories}
            selected={filters.categories}
            onChange={(value, checked) => handleMultiSelectChange("categories", value, checked)}
          />

          {/* Source Filter */}
          <MultiSelectFilter
            label="Sources"
            options={filterOptions.sources}
            selected={filters.sources}
            onChange={(value, checked) => handleMultiSelectChange("sources", value, checked)}
          />

          {/* Platform Filter */}
          <MultiSelectFilter
            label="Platforms"
            options={filterOptions.platforms}
            selected={filters.platforms}
            onChange={(value, checked) => handleMultiSelectChange("platforms", value, checked)}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>

            <Button 
              onClick={onRefresh} 
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Now"}
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.categories.length > 0 || filters.sources.length > 0 || filters.platforms.length > 0 || 
          (filters.dateRange.from && filters.dateRange.to && 
           (dayjs(filters.dateRange.from).format('YYYY-MM-DD') !== dayjs().subtract(7, 'days').format('YYYY-MM-DD') ||
            dayjs(filters.dateRange.to).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')))) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-sm text-gray-400">Active filters:</span>
            
            {/* Date Range Badge */}
            {filters.dateRange.from && filters.dateRange.to && 
             (dayjs(filters.dateRange.from).format('YYYY-MM-DD') !== dayjs().subtract(7, 'days').format('YYYY-MM-DD') ||
              dayjs(filters.dateRange.to).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) && (
              <Badge variant="secondary" className="bg-orange-900 text-orange-100">
                Date: {dayjs(filters.dateRange.from).format("MMM DD")} - {dayjs(filters.dateRange.to).format("MMM DD, YYYY")}
              </Badge>
            )}
            
            {filters.categories.map((category) => (
              <Badge key={category} variant="secondary" className="bg-blue-900 text-blue-100">
                Category: {category}
              </Badge>
            ))}
            {filters.sources.map((source) => (
              <Badge key={source} variant="secondary" className="bg-green-900 text-green-100">
                Source: {source}
              </Badge>
            ))}
            {filters.platforms.map((platform) => (
              <Badge key={platform} variant="secondary" className="bg-purple-900 text-purple-100">
                Platform: {platform}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MultiSelectFilterProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (value: string, checked: boolean) => void
}

function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
          <Filter className="h-4 w-4 mr-2" />
          {label}
          {selected.length > 0 && <Badge className="ml-2 bg-blue-600 text-white">{selected.length}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-gray-800 border-gray-700">
        <div className="space-y-2">
          <h4 className="font-medium text-white">{label}</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selected.includes(option)}
                  onCheckedChange={(checked) => onChange(option, checked as boolean)}
                />
                <label htmlFor={option} className="text-sm text-gray-300 cursor-pointer flex-1">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

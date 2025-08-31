'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChevronUp, 
  ChevronDown, 
  ExternalLink, 
  Eye,
  GripVertical,
  X
} from 'lucide-react'
import { TrendingPost } from '@/lib/types'
import { ColumnConfig, ColumnConfigService } from '@/lib/services/column-config-service'
import { formatScore, formatViralityScore, getCategoryWeightColor } from '@/lib/utils/score-formatter'
import { SimplePostAnalysisModal } from '@/components/simple-post-analysis-modal'

interface DynamicPostsTableProps {
  title: string
  posts: TrendingPost[]
  currentColumns: ColumnConfig[]
  onAddColumn: (columnId: string) => void
  onRemoveColumn: (columnId: string) => void
  onReorderColumns: (columns: ColumnConfig[]) => void
  showColumnManagement?: boolean
  postsPerPage?: number // Default to 10 posts per page
}

type SortConfig = {
  columnId: string
  direction: 'asc' | 'desc'
}

export function DynamicPostsTable({
  title,
  posts,
  currentColumns,
  onAddColumn,
  onRemoveColumn,
  onReorderColumns,
  showColumnManagement = true,
  postsPerPage = 10 // Default to 10 posts per page
}: DynamicPostsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPost, setSelectedPost] = useState<TrendingPost | null>(null)
  const [isPostAnalysisOpen, setIsPostAnalysisOpen] = useState(false)

  // Calculate pagination
  const totalPages = Math.ceil(posts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const currentPosts = posts.slice(startIndex, endIndex)

  // Sort posts based on current sort configuration
  const sortedPosts = useMemo(() => {
    if (!sortConfig) return currentPosts

    return [...currentPosts].sort((a, b) => {
      const aValue = getPostValue(a, sortConfig.columnId)
      const bValue = getPostValue(b, sortConfig.columnId)

      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [currentPosts, sortConfig])

  // Reset to first page when posts change
  useEffect(() => {
    setCurrentPage(1)
  }, [posts.length])

  const handleSort = (columnId: string) => {
    if (sortConfig?.columnId === columnId) {
      setSortConfig({
        columnId,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      })
    } else {
      setSortConfig({ columnId, direction: 'asc' })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of table when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenPostAnalysis = (post: TrendingPost) => {
    setSelectedPost(post)
    setIsPostAnalysisOpen(true)
  }

  const handleClosePostAnalysis = () => {
    setIsPostAnalysisOpen(false)
    setSelectedPost(null)
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'politics': return 'bg-blue-900 text-blue-100 border-blue-700'
      case 'crime': return 'bg-red-900 text-red-100 border-red-700'
      case 'corruption': return 'bg-orange-900 text-orange-100 border-orange-700'
      case 'accident': return 'bg-yellow-900 text-yellow-100 border-yellow-700'
      case 'business': return 'bg-emerald-900 text-emerald-100 border-emerald-700'
      case 'technology': return 'bg-purple-900 text-purple-100 border-purple-700'
      case 'entertainment': return 'bg-pink-900 text-pink-100 border-pink-700'
      case 'cyber crime': return 'bg-indigo-900 text-indigo-100 border-indigo-700'
      case 'international': return 'bg-teal-900 text-teal-100 border-teal-700'
      case 'national': return 'bg-cyan-900 text-cyan-100 border-cyan-700'
      case 'sports': return 'bg-lime-900 text-lime-100 border-lime-700'
      case 'health': return 'bg-rose-900 text-rose-100 border-rose-700'
      case 'education': return 'bg-violet-900 text-violet-100 border-violet-700'
      case 'environment': return 'bg-green-800 text-green-200 border-green-600'
      case 'science': return 'bg-sky-900 text-sky-100 border-sky-700'
      default: return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  const getSortIcon = (columnId: string) => {
    if (sortConfig?.columnId !== columnId) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-400" />
      : <ChevronDown className="w-4 h-4 text-blue-400" />
  }

  const handleDragStart = (columnId: string) => {
    if (!ColumnConfigService.isColumnFixed(columnId)) {
      setDraggedColumn(columnId)
    }
  }

  const handleDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    if (draggedColumn && !ColumnConfigService.isColumnFixed(targetColumnId)) {
      // Handle column reordering logic here
    }
  }

  const handleDrop = (targetColumnId: string) => {
    if (draggedColumn && !ColumnConfigService.isColumnFixed(targetColumnId)) {
      // Implement column reordering
      const newColumns = [...currentColumns]
      const draggedIndex = newColumns.findIndex(col => col.id === draggedColumn)
      const targetIndex = newColumns.findIndex(col => col.id === targetColumnId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedCol] = newColumns.splice(draggedIndex, 1)
        newColumns.splice(targetIndex, 0, draggedCol)
        
        // Update positions
        newColumns.forEach((col, index) => {
          if (!ColumnConfigService.isColumnFixed(col.id)) {
            col.position = index
          }
        })
        
        onReorderColumns(newColumns)
      }
    }
    setDraggedColumn(null)
  }

  const renderCell = (post: TrendingPost, column: ColumnConfig) => {
    const value = getPostValue(post, column.id)

    switch (column.id) {
      case 'postDate':
        return (
          <span className="text-sm text-gray-300">
            {new Date(post.postDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )

      case 'postText':
        return (
          <div className="max-w-xs">
            <p className="text-sm line-clamp-2 text-gray-300">
              {post.postText.length > 100 
                ? `${post.postText.substring(0, 100)}...` 
                : post.postText
              }
            </p>
          </div>
        )

      case 'category':
        return (
          <Badge className={`text-xs ${getCategoryColor(post.category || 'Uncategorized')}`}>
            {post.category || 'Uncategorized'}
          </Badge>
        )

      case 'sentiment':
        const sentimentColors = {
          positive: 'bg-green-900 text-green-300 border-green-700',
          negative: 'bg-red-900 text-red-300 border-red-700',
          neutral: 'bg-gray-700 text-gray-300 border-gray-600'
        }
        return (
          <Badge className={`text-xs ${sentimentColors[post.sentiment as keyof typeof sentimentColors] || sentimentColors.neutral}`}>
            {post.sentiment}
          </Badge>
        )

      case 'reactions':
      case 'shares':
      case 'comments':
      case 'sourceCount':
        return (
          <span className="font-mono text-sm text-gray-300">
            {formatScore(value as number)}
          </span>
        )

      case 'viralityScore':
        return (
          <span className="font-mono text-sm text-yellow-400">
            {formatViralityScore(value as number)}
          </span>
        )

      case 'sourceWeight':
      case 'newsFlowWeight':
      case 'newsFlowWeightByCategory':
      case 'finalTrendingScore':
        return (
          <span className="font-mono text-sm text-blue-400">
            {formatScore(value as number, 2)}
          </span>
        )

      case 'actions':
        return (
          <div className="flex items-center gap-2">
            {post.postLink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(post.postLink!, '_blank')}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenPostAnalysis(post)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        )

      default:
        return (
          <span className="text-sm text-gray-300">
            {value !== null && value !== undefined ? String(value) : '-'}
          </span>
        )
    }
  }

  const getPostValue = (post: TrendingPost, columnId: string) => {
    switch (columnId) {
      case 'postDate': return post.postDate
      case 'postText': return post.postText
      case 'category': return post.category
      case 'sentiment': return post.sentiment
      case 'source': return post.source
      case 'reactions': return post.reactions
      case 'shares': return post.shares
      case 'comments': return post.comments
      case 'sourceCount': return post.sourceCount
      case 'viralityScore': return post.viralityScore
      case 'sourceWeight': return post.sourceWeight
      case 'newsFlowWeight': return post.newsFlowWeight
      case 'newsFlowWeightByCategory': return post.newsFlowWeightByCategory
      case 'finalTrendingScore': return post.finalTrendingScore
      default: return null
    }
  }

  return (
    <div>
      <Card className="bg-[#1E1E1E] border-gray-700 text-white">
        <CardHeader className="bg-[#1E1E1E] border-b border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            {title}
            {sortConfig && (
              <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                Sorted by {sortConfig.columnId} ({sortConfig.direction})
              </Badge>
            )}
          </CardTitle>
          {showColumnManagement && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {currentColumns.length} columns
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="bg-[#1E1E1E]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800">
                {currentColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={`${column.fixed ? 'bg-gray-800' : 'bg-[#1E1E1E]'} ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-700' : ''
                    } border-gray-700 text-gray-300`}
                    style={{ width: column.width }}
                    draggable={!column.fixed}
                    onDragStart={() => handleDragStart(column.id)}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDrop={() => handleDrop(column.id)}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                      <div className="flex items-center gap-2">
                        {!column.fixed && (
                          <GripVertical className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="font-medium text-white">{column.label}</span>
                        {column.sortable && getSortIcon(column.id)}
                        {!column.fixed && showColumnManagement && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveColumn(column.id)
                            }}
                            className="h-6 w-6 p-0 ml-auto text-red-400 hover:text-red-300 hover:bg-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPosts.map((post, index) => (
                <TableRow key={post.id} className="border-gray-700 hover:bg-gray-800">
                  {currentColumns.map((column) => (
                    <TableCell key={column.id} className="border-gray-700">
                      {renderCell(post, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {sortedPosts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No posts found matching the current criteria.
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 py-6 border-t border-gray-700">
            {/* Page Info */}
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, posts.length)} of {posts.length} posts
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                Previous
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const shouldShow = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  
                  if (!shouldShow) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-500">...</span>
                    }
                    return null
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 p-0 ${
                        page === currentPage 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                Next
              </Button>
            </div>
            
            {/* Posts Per Page Selector */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Posts per page:</span>
              <select 
                value={postsPerPage} 
                onChange={(e) => {
                  const newPostsPerPage = parseInt(e.target.value)
                  // Update postsPerPage in parent component if needed
                  // For now, we'll just reset to page 1
                  setCurrentPage(1)
                }}
                className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Post Analysis Modal */}
    <SimplePostAnalysisModal
      isOpen={isPostAnalysisOpen}
      onClose={handleClosePostAnalysis}
      post={selectedPost}
    />
  </div>
  )
}

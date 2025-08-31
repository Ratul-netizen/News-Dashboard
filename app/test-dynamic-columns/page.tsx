'use client'

import React, { useState } from 'react'
import { DynamicPostsTable } from '@/components/dynamic-posts-table'
import { AnalyticsFieldsPanel } from '@/components/analytics-fields-panel'
import { ColumnConfig, ColumnConfigService } from '@/lib/services/column-config-service'
import { TrendingPost } from '@/lib/types'

// Sample data for testing
const samplePosts: TrendingPost[] = [
  {
    id: '1',
    postText: 'Breaking news: Major cybersecurity breach detected in government systems. Authorities are investigating the incident.',
    category: 'Cyber Crime',
    source: 'BBC News বাংলা',
    platform: 'Facebook',
    reactions: 598555,
    shares: 16593,
    comments: 61355,
    sourceCount: 5,
    postDate: new Date('2025-08-13T20:48:00'),
    postLink: 'https://example.com/post1',
    postAnalysis: null,
    trendingScore: 13722.1,
    sourceWeight: 1950.0,
    newsFlowWeight: 103000.0,
    newsFlowWeightByCategory: 1030000.0,
    viralityScore: 7,
    finalTrendingScore: 4127.8,
    sentiment: 'negative'
  },
  {
    id: '2',
    postText: 'New technology breakthrough in renewable energy could revolutionize the industry.',
    category: 'Technology',
    source: 'The Daily Star',
    platform: 'Twitter',
    reactions: 125000,
    shares: 8500,
    comments: 12000,
    sourceCount: 3,
    postDate: new Date('2025-08-14T10:30:00'),
    postLink: 'https://example.com/post2',
    postAnalysis: null,
    trendingScore: 12539.4,
    sourceWeight: 1200.0,
    newsFlowWeight: 85000.0,
    newsFlowWeightByCategory: 552500.0,
    viralityScore: 5,
    finalTrendingScore: 3250.2,
    sentiment: 'positive'
  },
  {
    id: '3',
    postText: 'Political developments in the region spark international discussions.',
    category: 'Politics',
    source: 'Reuters',
    platform: 'LinkedIn',
    reactions: 89000,
    shares: 12000,
    comments: 8900,
    sourceCount: 4,
    postDate: new Date('2025-08-14T15:20:00'),
    postLink: 'https://example.com/post3',
    postAnalysis: null,
    trendingScore: 10723.1,
    sourceWeight: 980.0,
    newsFlowWeight: 72000.0,
    newsFlowWeightByCategory: 684000.0,
    viralityScore: 6,
    finalTrendingScore: 2980.5,
    sentiment: 'neutral'
  },
  {
    id: '4',
    postText: 'Business sector shows strong growth despite economic challenges.',
    category: 'Business',
    source: 'Bloomberg',
    platform: 'Facebook',
    reactions: 45000,
    shares: 3200,
    comments: 5600,
    sourceCount: 2,
    postDate: new Date('2025-08-14T12:15:00'),
    postLink: 'https://example.com/post4',
    postAnalysis: null,
    trendingScore: 10113.0,
    sourceWeight: 650.0,
    newsFlowWeight: 38000.0,
    newsFlowWeightByCategory: 266000.0,
    viralityScore: 4,
    finalTrendingScore: 1850.8,
    sentiment: 'positive'
  },
  {
    id: '5',
    postText: 'Entertainment industry celebrates record-breaking achievements this year.',
    category: 'Entertainment',
    source: 'Variety',
    platform: 'Instagram',
    reactions: 78000,
    shares: 8900,
    comments: 12000,
    sourceCount: 3,
    postDate: new Date('2025-08-14T18:45:00'),
    postLink: 'https://example.com/post5',
    postAnalysis: null,
    trendingScore: 3834.1,
    sourceWeight: 450.0,
    newsFlowWeight: 25000.0,
    newsFlowWeightByCategory: 100000.0,
    viralityScore: 3,
    finalTrendingScore: 950.2,
    sentiment: 'positive'
  }
]

export default function TestDynamicColumnsPage() {
  const [currentColumns, setCurrentColumns] = useState<ColumnConfig[]>(
    ColumnConfigService.getDefaultConfiguration().columns
  )
  const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(false)

  const handleAddColumn = (columnId: string) => {
    const columnToAdd = ColumnConfigService.getColumnById(columnId)
    if (columnToAdd) {
      // Find the highest position among customizable columns
      const maxPosition = Math.max(
        ...currentColumns
          .filter(col => !ColumnConfigService.isColumnFixed(col.id))
          .map(col => col.position)
      )
      
      const newColumn = { ...columnToAdd, position: maxPosition + 1 }
      const newColumns = [...currentColumns, newColumn]
      
      // Sort by position
      newColumns.sort((a, b) => a.position - b.position)
      setCurrentColumns(newColumns)
    }
  }

  const handleRemoveColumn = (columnId: string) => {
    if (!ColumnConfigService.isColumnFixed(columnId)) {
      const newColumns = currentColumns.filter(col => col.id !== columnId)
      setCurrentColumns(newColumns)
    }
  }

  const handleReorderColumns = (columns: ColumnConfig[]) => {
    setCurrentColumns(columns)
  }

  const handleResetToDefault = () => {
    setCurrentColumns(ColumnConfigService.getDefaultConfiguration().columns)
  }

  const handleSaveConfiguration = (name: string) => {
    console.log('Saving configuration:', name, currentColumns)
    // This would typically save to a database
    alert(`Configuration "${name}" saved successfully!`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dynamic Columns System Test
          </h1>
          <p className="text-gray-600">
            Test the dynamic column management system with sample data
          </p>
        </div>

        {/* Current Configuration Display */}
        <div className="bg-white rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-3">Current Column Configuration</h2>
          <div className="flex flex-wrap gap-2">
            {currentColumns.map((column, index) => (
              <div
                key={column.id}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  column.fixed 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {index + 1}. {column.label}
                {column.fixed && <span className="ml-1">🔒</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Viral Posts Table */}
        <DynamicPostsTable
          title="Top 10 Viral Posts (Test Data)"
          posts={samplePosts}
          currentColumns={currentColumns}
          onAddColumn={handleAddColumn}
          onRemoveColumn={handleRemoveColumn}
          onReorderColumns={handleReorderColumns}
          showColumnManagement={true}
        />

        {/* All News Posts Table */}
        <DynamicPostsTable
          title="All News Posts (Test Data)"
          posts={samplePosts}
          currentColumns={currentColumns}
          onAddColumn={handleAddColumn}
          onRemoveColumn={handleRemoveColumn}
          onReorderColumns={handleReorderColumns}
          showColumnManagement={false}
        />

        {/* Analytics Fields Panel */}
        <AnalyticsFieldsPanel
          currentColumns={currentColumns}
          onAddColumn={handleAddColumn}
          onRemoveColumn={handleRemoveColumn}
          onResetToDefault={handleResetToDefault}
          onSaveConfiguration={handleSaveConfiguration}
          isOpen={isAnalyticsPanelOpen}
          onToggle={() => setIsAnalyticsPanelOpen(!isAnalyticsPanelOpen)}
        />

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test:</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• <strong>Click "Configure Columns"</strong> button (bottom right) to open the analytics panel</li>
            <li>• <strong>Add new columns</strong> from the available fields</li>
            <li>• <strong>Remove columns</strong> by clicking the X button on column headers (except fixed ones)</li>
            <li>• <strong>Sort columns</strong> by clicking on sortable column headers</li>
            <li>• <strong>Save configurations</strong> with custom names</li>
            <li>• <strong>Reset to default</strong> to restore original layout</li>
          </ul>
        </div>

        {/* Sample Data Info */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sample Data Includes:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
            <div>
              <strong>Categories:</strong> Cyber Crime, Technology, Politics, Business, Entertainment
            </div>
            <div>
              <strong>Sentiments:</strong> Positive, Negative, Neutral
            </div>
            <div>
              <strong>Scoring Fields:</strong> All new scoring metrics implemented
            </div>
            <div>
              <strong>Engagement:</strong> Realistic reaction, share, comment counts
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  X, 
  Settings, 
  RotateCcw,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react'
import { ColumnConfig, ColumnConfigService } from '@/lib/services/column-config-service'
import { formatScore } from '@/lib/utils/score-formatter'

interface AnalyticsFieldsPanelProps {
  currentColumns: ColumnConfig[]
  onAddColumn: (columnId: string) => void
  onRemoveColumn: (columnId: string) => void
  onResetToDefault: () => void
  onSaveConfiguration: (name: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function AnalyticsFieldsPanel({
  currentColumns,
  onAddColumn,
  onRemoveColumn,
  onResetToDefault,
  onSaveConfiguration,
  isOpen,
  onToggle
}: AnalyticsFieldsPanelProps) {
  const [configName, setConfigName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  const allAvailableColumns = ColumnConfigService.getAllAvailableColumns()
  const customizableColumns = ColumnConfigService.getCustomizableColumns()
  const fixedColumns = ColumnConfigService.getFixedColumns()

  const availableToAdd = customizableColumns.filter(
    col => !currentColumns.some(current => current.id === col.id)
  )

  const currentCustomizableColumns = currentColumns.filter(
    col => !ColumnConfigService.isColumnFixed(col.id)
  )

  const handleSaveConfig = () => {
    if (configName.trim()) {
      onSaveConfiguration(configName.trim())
      setConfigName('')
      setShowSaveForm(false)
    }
  }

  const getColumnTypeColor = (type: string) => {
    switch (type) {
      case 'number': return 'bg-blue-900 text-blue-300'
      case 'text': return 'bg-gray-700 text-gray-300'
      case 'date': return 'bg-green-900 text-green-300'
      case 'category': return 'bg-purple-900 text-purple-300'
      case 'sentiment': return 'bg-orange-900 text-orange-300'
      case 'actions': return 'bg-red-900 text-red-300'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 shadow-lg bg-[#1E1E1E] border-gray-600 text-white hover:bg-gray-800"
      >
        <Settings className="w-4 h-4 mr-2" />
        Configure Columns
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[#1E1E1E] border-gray-700">
        <CardHeader className="bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="w-5 h-5" />
              Analytics Fields & Column Configuration
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onToggle} className="text-gray-400 hover:text-white hover:bg-gray-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-[#1E1E1E]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Available Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Available Fields</h3>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  {availableToAdd.length} available
                </Badge>
              </div>

              {/* Fixed Columns (Read-only) */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Fixed Columns (Always Visible)</h4>
                {fixedColumns.map((column) => (
                  <div key={column.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600">
                    <GripVertical className="w-4 h-4 text-gray-500" />
                    <Badge variant="outline" className={`${getColumnTypeColor(column.type)} border-gray-600`}>
                      {column.type}
                    </Badge>
                    <span className="text-sm font-medium text-gray-300">{column.label}</span>
                    <Badge variant="secondary" className="ml-auto bg-gray-700 text-gray-300">Fixed</Badge>
                  </div>
                ))}
              </div>

              <Separator className="bg-gray-600" />

              {/* Available Customizable Columns */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Available to Add</h4>
                {availableToAdd.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">All available columns are already added</p>
                ) : (
                  availableToAdd.map((column) => (
                    <div key={column.id} className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-600">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getColumnTypeColor(column.type)} border-gray-600`}>
                          {column.type}
                        </Badge>
                        <span className="text-sm font-medium text-gray-300">{column.label}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onAddColumn(column.id)}
                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Current Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Current Configuration</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveForm(true)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Save Config
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetToDefault}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Current Columns */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Active Columns</h4>
                {currentColumns.map((column, index) => (
                  <div key={column.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600">
                    <span className="text-xs text-gray-500 w-6">{index + 1}</span>
                    <Badge variant="outline" className={`${getColumnTypeColor(column.type)} border-gray-600`}>
                      {column.type}
                    </Badge>
                    <span className="text-sm font-medium flex-1 text-gray-300">{column.label}</span>
                    {column.width && (
                      <span className="text-xs text-gray-500">({column.width}px)</span>
                    )}
                    {!ColumnConfigService.isColumnFixed(column.id) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveColumn(column.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Save Configuration Form */}
              {showSaveForm && (
                <div className="p-4 bg-gray-800 rounded border border-gray-600">
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">Save Configuration</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Configuration name..."
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-600 rounded text-sm bg-gray-700 text-white placeholder-gray-400"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      disabled={!configName.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSaveForm(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Configuration Info */}
              <div className="p-3 bg-gray-800 rounded text-xs text-gray-400 border border-gray-600">
                <p><strong>Fixed Columns:</strong> Cannot be moved or removed</p>
                <p><strong>Customizable Columns:</strong> Add, remove, or reorder as needed</p>
                <p><strong>Actions Column:</strong> Always appears last for consistency</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export interface ColumnConfig {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'category' | 'sentiment' | 'actions'
  width?: number
  sortable: boolean
  fixed: boolean
  position: number
}

export interface TableConfiguration {
  id: string
  name: string
  columns: ColumnConfig[]
  createdAt: Date
  updatedAt: Date
  isDefault: boolean
}

export class ColumnConfigService {
  // Fixed columns that cannot be moved or removed
  private static readonly FIXED_START_COLUMNS: ColumnConfig[] = [
    {
      id: 'postDate',
      label: 'Post Date',
      type: 'date',
      width: 150,
      sortable: true,
      fixed: true,
      position: 0
    },
    {
      id: 'postText',
      label: 'Post Text',
      type: 'text',
      width: 300,
      sortable: false,
      fixed: true,
      position: 1
    },
    {
      id: 'category',
      label: 'Category',
      type: 'category',
      width: 120,
      sortable: true,
      fixed: true,
      position: 2
    },
    {
      id: 'sentiment',
      label: 'Sentiment',
      type: 'sentiment',
      width: 100,
      sortable: true,
      fixed: true,
      position: 3
    },
    {
      id: 'source',
      label: 'Source',
      type: 'text',
      width: 150,
      sortable: true,
      fixed: true,
      position: 4
    }
  ]

  // Fixed end column (Actions)
  private static readonly FIXED_END_COLUMNS: ColumnConfig[] = [
    {
      id: 'actions',
      label: 'Actions',
      type: 'actions',
      width: 100,
      sortable: false,
      fixed: true,
      position: 999 // High position to ensure it's always last
    }
  ]

  // Available customizable columns
  private static readonly AVAILABLE_CUSTOMIZABLE_COLUMNS: ColumnConfig[] = [
    {
      id: 'reactions',
      label: 'Reactions',
      type: 'number',
      width: 120,
      sortable: true,
      fixed: false,
      position: 5
    },
    {
      id: 'shares',
      label: 'Shares',
      type: 'number',
      width: 100,
      sortable: true,
      fixed: false,
      position: 6
    },
    {
      id: 'comments',
      label: 'Comments',
      type: 'number',
      width: 120,
      sortable: true,
      fixed: false,
      position: 7
    },
    {
      id: 'sourceCount',
      label: '# Sources',
      type: 'number',
      width: 100,
      sortable: true,
      fixed: false,
      position: 8
    },
    {
      id: 'viralityScore',
      label: 'Virality Score',
      type: 'number',
      width: 140,
      sortable: true,
      fixed: false,
      position: 9
    },
    {
      id: 'sourceWeight',
      label: 'Source Weight',
      type: 'number',
      width: 140,
      sortable: true,
      fixed: false,
      position: 10
    },
    {
      id: 'newsFlowWeight',
      label: 'News Flow Weight',
      type: 'number',
      width: 160,
      sortable: true,
      fixed: false,
      position: 11
    },
    {
      id: 'newsFlowWeightByCategory',
      label: 'News Flow Weight By Category',
      type: 'number',
      width: 200,
      sortable: true,
      fixed: false,
      position: 12
    },
    {
      id: 'finalTrendingScore',
      label: 'Final Trending Score',
      type: 'number',
      width: 160,
      sortable: true,
      fixed: false,
      position: 13
    }
  ]

  /**
   * Get the default table configuration
   */
  static getDefaultConfiguration(): TableConfiguration {
    const defaultColumns = [
      ...this.FIXED_START_COLUMNS,
      // Only show 2 most important customizable columns by default
      ...this.AVAILABLE_CUSTOMIZABLE_COLUMNS.slice(0, 2),
      ...this.FIXED_END_COLUMNS
    ]

    return {
      id: 'default',
      name: 'Default Configuration',
      columns: defaultColumns,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: true
    }
  }

  /**
   * Get all available columns (fixed + customizable)
   */
  static getAllAvailableColumns(): ColumnConfig[] {
    return [
      ...this.FIXED_START_COLUMNS,
      ...this.AVAILABLE_CUSTOMIZABLE_COLUMNS,
      ...this.FIXED_END_COLUMNS
    ]
  }

  /**
   * Get customizable columns only
   */
  static getCustomizableColumns(): ColumnConfig[] {
    return this.AVAILABLE_CUSTOMIZABLE_COLUMNS
  }

  /**
   * Get fixed columns only
   */
  static getFixedColumns(): ColumnConfig[] {
    return [...this.FIXED_START_COLUMNS, ...this.FIXED_END_COLUMNS]
  }

  /**
   * Check if a column is fixed (cannot be moved/removed)
   */
  static isColumnFixed(columnId: string): boolean {
    return this.getFixedColumns().some(col => col.id === columnId)
  }

  /**
   * Get column configuration by ID
   */
  static getColumnById(columnId: string): ColumnConfig | undefined {
    return this.getAllAvailableColumns().find(col => col.id === columnId)
  }

  /**
   * Validate column configuration
   */
  static validateConfiguration(columns: ColumnConfig[]): boolean {
    // Must have all fixed columns
    const fixedColumnIds = this.getFixedColumns().map(col => col.id)
    const hasAllFixed = fixedColumnIds.every(id => 
      columns.some(col => col.id === id)
    )

    if (!hasAllFixed) return false

    // Fixed columns must be in correct positions
    const fixedStartColumns = this.FIXED_START_COLUMNS
    const fixedEndColumns = this.FIXED_END_COLUMNS

    // Check start columns are in order
    for (let i = 0; i < fixedStartColumns.length; i++) {
      const column = columns.find(col => col.id === fixedStartColumns[i].id)
      if (!column || column.position !== i) return false
    }

    // Check end columns are at the end
    const maxPosition = Math.max(...columns.map(col => col.position))
    for (const endCol of fixedEndColumns) {
      const column = columns.find(col => col.id === endCol.id)
      if (!column || column.position !== maxPosition) return false
    }

    return true
  }

  /**
   * Create a new configuration from current state
   */
  static createConfiguration(
    name: string, 
    columns: ColumnConfig[], 
    isDefault: boolean = false
  ): TableConfiguration {
    return {
      id: `config_${Date.now()}`,
      name,
      columns: [...columns], // Clone to avoid mutations
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault
    }
  }

  /**
   * Reset configuration to default
   */
  static resetToDefault(): TableConfiguration {
    return this.getDefaultConfiguration()
  }
}

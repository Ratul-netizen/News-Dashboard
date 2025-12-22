"use client"

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Network, ExternalLink, Calendar, Heart, Share2, MessageCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import dayjs from 'dayjs'

interface GraphNode {
  id: string
  label: string
  type: 'source' | 'platform' | 'master'
  x?: number
  y?: number
  data?: {
    posts: any[]
    name: string
    postText?: string
    postDate?: Date
    postLink?: string | null
    platform?: string
    source?: string
    sentiment?: string | null
  }
}

interface GraphEdge {
  from: string
  to: string
}

interface Post {
  id: string
  postText: string
  postDate: Date
  postLink: string | null
  platform: string
  source: string
  reactions: number
  shares: number
  comments: number
  sentiment: string | null
}

// Platform code to name mapping (for single-letter codes)
const PLATFORM_CODE_MAP: { [key: string]: string } = {
  'F': 'facebook',
  'Y': 'youtube',
  'T': 'twitter',
  'X': 'x',
  'I': 'instagram',
  'L': 'linkedin',
  'R': 'reddit',
  'N': 'news',
  'TT': 'tiktok',
  'default': 'default'
}

// Platform color mapping
const PLATFORM_COLORS: { [key: string]: string } = {
  'facebook': '#1877F2',
  'youtube': '#FF0000',
  'twitter': '#1DA1F2',
  'x': '#000000',
  'instagram': '#E4405F',
  'linkedin': '#0A66C2',
  'reddit': '#FF4500',
  'news': '#808080',
  'website': '#10B981',
  'blog': '#F59E0B',
  'telegram': '#0088CC',
  'whatsapp': '#25D366',
  'tiktok': '#000000',
  'default': '#6B7280'
}

interface SourcePlatformGraphModalProps {
  isOpen: boolean
  onClose: () => void
  posts: Post[]
  mainPost?: Post
}

export function SourcePlatformGraphModal({ isOpen, onClose, posts, mainPost }: SourcePlatformGraphModalProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedSource, setSelectedSource] = useState<any | null>(null)
  const [showPostsModal, setShowPostsModal] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate basic graph data (no weights or scores)
  const { nodes, edges } = useMemo(() => {
    if (!posts || posts.length === 0) {
      return { nodes: [], edges: [] }
    }

    const graphNodes: GraphNode[] = []
    const graphEdges: GraphEdge[] = []

    // Get unique sources and platforms
    const uniqueSources = Array.from(new Set(posts.map(p => p.source)))
    const uniquePlatforms = Array.from(new Set(posts.map(p => p.platform)))

    // Create master/root node if mainPost is provided
    if (mainPost) {
      graphNodes.push({
        id: 'master-0',
        label: 'Main Post',
        type: 'master',
        data: {
          posts: [mainPost],
          name: 'Main Post',
          postText: mainPost.postText,
          postDate: mainPost.postDate,
          postLink: mainPost.postLink,
          platform: mainPost.platform,
          source: mainPost.source,
          sentiment: mainPost.sentiment
        }
      })
    }

    // Create source nodes
    uniqueSources.forEach((source, index) => {
      const sourcePosts = posts.filter(p => p.source === source)
      graphNodes.push({
        id: `source-${index}`,
        label: source,
        type: 'source',
        data: { posts: sourcePosts, name: source }
      })
    })

    // Create platform nodes
    uniquePlatforms.forEach((platform, index) => {
      const platformPosts = posts.filter(p => p.platform === platform)
      graphNodes.push({
        id: `platform-${index}`,
        label: platform,
        type: 'platform',
        data: { posts: platformPosts, name: platform }
      })
    })

    // Create connections from master node to all platform nodes
    if (mainPost) {
      uniquePlatforms.forEach((_, platformIndex) => {
        graphEdges.push({
          from: `platform-${platformIndex}`,
          to: 'master-0'
        })
      })
    }

    // Create basic connections (no weights) - source to platform
    uniqueSources.forEach((source, sourceIndex) => {
      uniquePlatforms.forEach((platform, platformIndex) => {
        const hasConnection = posts.some(p => p.source === source && p.platform === platform)
        if (hasConnection) {
          graphEdges.push({
            from: `source-${sourceIndex}`,
            to: `platform-${platformIndex}`
          })
        }
      })
    })

    // Position nodes in bipartite layout with perfect vertical alignment
    // Use responsive dimensions that fit within container
    const svgWidth = 1000
    const svgHeight = 700
    
    // Fixed X positions for perfect column alignment
    const sourceColumnX = 150
    const platformColumnX = 500 // Center
    const masterNodeX = 850
    
    // Calculate vertical spacing for perfect alignment
    // Use independent spacing per column to avoid cross-column skew
    const topMargin = 100
    const bottomMargin = 100
    const availableHeight = svgHeight - topMargin - bottomMargin
    const sourceSpacing = uniqueSources.length > 1 ? availableHeight / (uniqueSources.length - 1) : 0
    const platformSpacing = uniquePlatforms.length > 1 ? availableHeight / (uniquePlatforms.length - 1) : 0
    const startY = topMargin

    // Position master node at the right side, vertically centered with platforms
    if (mainPost) {
      const masterNode = graphNodes.find(n => n.id === 'master-0')
      if (masterNode) {
        masterNode.x = masterNodeX
        // Align master node vertically with the middle of the platform column
        const platformMiddleIndex = (uniquePlatforms.length - 1) / 2
        masterNode.y = startY + (platformMiddleIndex * platformSpacing)
      }
    }

    // Position source nodes on the left side - perfectly aligned vertically
    uniqueSources.forEach((_, index) => {
      const node = graphNodes.find(n => n.id === `source-${index}`)
      if (node) {
        node.x = sourceColumnX
        node.y = startY + (index * sourceSpacing)
      }
    })

    // Position platform nodes in the middle - perfectly aligned vertically
    uniquePlatforms.forEach((_, index) => {
      const node = graphNodes.find(n => n.id === `platform-${index}`)
      if (node) {
        node.x = platformColumnX
        node.y = startY + (index * platformSpacing)
      }
    })

    return { nodes: graphNodes, edges: graphEdges }
  }, [posts, mainPost])

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node)

    // If it's a source node, show posts modal
    if (node.type === 'source' && node.data?.posts) {
      setSelectedSource({
        source: node.data.name,
        posts: node.data.posts,
        engagement: node.data.posts.reduce((sum: number, p: Post) => sum + (p.reactions || 0) + (p.shares || 0) + (p.comments || 0), 0)
      })
      setShowPostsModal(true)
    }
  }

  const handleEdgeClick = (edge: GraphEdge, event: React.MouseEvent) => {
    event.stopPropagation()
    const fromNode = nodes.find(n => n.id === edge.from)
    const toNode = nodes.find(n => n.id === edge.to)
    if (fromNode && toNode) {
      alert(`Connection: ${fromNode.label} → ${toNode.label}`)
    }
  }

  const getNodeRadius = useCallback((node: GraphNode) => {
    return node.type === 'master' ? 35 : node.type === 'source' ? 25 : 20
  }, [])

  const getHorizontalAnchor = useCallback((node: GraphNode, side: 'left' | 'right') => {
    if (node.x === undefined || node.y === undefined) {
      return { x: node.x || 0, y: node.y || 0 }
    }

    const radius = getNodeRadius(node)
    return {
      x: node.x + (side === 'right' ? radius : -radius),
      y: node.y
    }
  }, [getNodeRadius])

  // Calculate point on circle edge for line connection (fallback radial)
  const getCircleEdgePoint = useCallback((node: GraphNode, targetNode: GraphNode) => {
    if (!node.x || !node.y || !targetNode.x || !targetNode.y) {
      return { x: node.x || 0, y: node.y || 0 }
    }
    const radius = getNodeRadius(node)
    const dx = targetNode.x - (node.x || 0)
    const dy = targetNode.y - (node.y || 0)
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // If nodes are too close or overlapping, return edge point anyway
    if (distance === 0 || distance < radius) {
      // Return a point on the edge in a default direction
      return {
        x: (node.x || 0) + radius,
        y: node.y || 0
      }
    }
    
    // Calculate point on circle edge in direction of target
    // Normalize the direction vector and multiply by radius
    const normalizedDx = dx / distance
    const normalizedDy = dy / distance
    
    return {
      x: (node.x || 0) + normalizedDx * radius,
      y: (node.y || 0) + normalizedDy * radius
    }
  }, [getNodeRadius])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Zoom controls
  const zoomIn = useCallback(() => setScale(prev => Math.min(prev + 0.2, 3)), [])
  const zoomOut = useCallback(() => setScale(prev => Math.max(prev - 0.2, 0.3)), [])
  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(prev => Math.max(0.3, Math.min(3, prev + delta)))
  }, [])

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element
    // Don't start dragging if clicking on interactive elements (nodes, edges, text, buttons)
    if (
      target.tagName === 'circle' ||
      target.tagName === 'line' ||
      target.tagName === 'text' ||
      target.tagName === 'foreignObject' ||
      target.closest('foreignObject') ||
      target.closest('button') ||
      target.closest('[role="button"]')
    ) {
      return
    }
    
    // Allow dragging on SVG background, grid, or empty space
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    e.preventDefault()
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Attach global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          zoomIn()
        } else if (e.key === '-') {
          e.preventDefault()
          zoomOut()
        } else if (e.key === '0') {
          e.preventDefault()
          resetZoom()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomIn, zoomOut, resetZoom])

  // Get platform color - handles both single-letter codes and full names
  const getPlatformColor = useCallback((platform: string) => {
    // First check if it's a single-letter code (F, Y, T, N, etc.)
    const upperCode = platform.toUpperCase()
    if (PLATFORM_CODE_MAP[upperCode]) {
      const platformName = PLATFORM_CODE_MAP[upperCode]
      return PLATFORM_COLORS[platformName] || PLATFORM_COLORS.default
    }
    // Otherwise try direct lookup with normalized name
    const normalizedPlatform = platform.toLowerCase()
    return PLATFORM_COLORS[normalizedPlatform] || PLATFORM_COLORS.default
  }, [])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-gray-900 border-gray-800 text-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Network className="w-6 h-6 text-blue-400" />
              Source-Platform Network Graph
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Interactive visualization of source-platform relationships. Click sources to view posts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {mainPost && (
                  <div className="flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded">
                    <div className="w-4 h-4 rounded-full border-2 border-yellow-300" style={{ backgroundColor: '#FFD700', boxShadow: '0 0 6px rgba(255, 215, 0, 0.5)' }}></div>
                    <span className="text-gray-200 font-medium">Main Post (origin)</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-300"></div>
                  <span className="text-gray-200 font-medium">Sources (clickable)</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded">
                  <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-purple-300"></div>
                  <span className="text-gray-200 font-medium">Platforms</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded">
                  <div className="w-8 h-0.5 bg-gray-400"></div>
                  <span className="text-gray-200 font-medium">Connections (clickable)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  title="Zoom Out (Ctrl -)"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  title="Zoom In (Ctrl +)"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetZoom}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  title="Reset View (Ctrl 0)"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Badge className="bg-blue-900 text-blue-100">
                  {Math.round(scale * 100)}% • {nodes.filter(n => n.type === 'source').length} sources • {nodes.filter(n => n.type === 'platform').length} platforms • {edges.length} connections
                </Badge>
              </div>
            </div>

            {/* Graph Visualization */}
            <div
              ref={containerRef}
              className="bg-gray-950 rounded-lg overflow-hidden border border-gray-700 relative shadow-inner"
              style={{ height: '600px', maxWidth: '100%' }}
            >
              <div
                className="overflow-auto w-full h-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                onWheel={handleWheel}
                style={{ contain: 'layout style paint' }}
              >
                <svg
                  ref={svgRef}
                  width="1000"
                  height="700"
                  className="block"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    minWidth: '100%',
                    maxWidth: '100%'
                  }}
                  onMouseDown={handleMouseDown}
                  viewBox="0 0 1000 700"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1F2937" strokeWidth="0.8" opacity="0.5" />
                    </pattern>
                  </defs>
                  <rect width="1000" height="700" fill="#0A0A0A" />
                  <rect width="1000" height="700" fill="url(#grid)" opacity="0.3" />

                  {/* Edges (basic connections, no weights) - Connect from edge to edge */}
                  <g id="edges">
                    {edges.map((edge, index) => {
                      const fromNode = nodes.find(n => n.id === edge.from)
                      const toNode = nodes.find(n => n.id === edge.to)
                      if (!fromNode || !toNode || fromNode.x === undefined || toNode.x === undefined || fromNode.y === undefined || toNode.y === undefined) {
                        return null
                      }

                      // Calculate edge points on circles - ensure they're on the perimeter
                      const isSourceToPlatform = fromNode.type === 'source' && toNode.type === 'platform'
                      const isPlatformToMaster = fromNode.type === 'platform' && toNode.type === 'master'

                      const startPoint = (isSourceToPlatform || isPlatformToMaster)
                        ? getHorizontalAnchor(fromNode, 'right')
                        : getCircleEdgePoint(fromNode, toNode)
                      const endPoint = (isSourceToPlatform || isPlatformToMaster)
                        ? getHorizontalAnchor(toNode, 'left')
                        : getCircleEdgePoint(toNode, fromNode)

                      return (
                        <TooltipProvider key={`edge-${index}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <line
                                x1={startPoint.x}
                                y1={startPoint.y}
                                x2={endPoint.x}
                                y2={endPoint.y}
                                stroke={toNode.type === 'master' ? '#6B7280' : '#4B5563'}
                                strokeWidth={toNode.type === 'master' ? '2.5' : '2'}
                                opacity={toNode.type === 'master' ? '0.7' : '0.5'}
                                className="cursor-pointer hover:stroke-blue-400 hover:opacity-100 transition-all"
                                onClick={(e) => handleEdgeClick(edge, e)}
                                style={{ 
                                  filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.3))',
                                  transition: 'all 0.2s ease',
                                  pointerEvents: 'stroke'
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">Connection: {fromNode.label} → {toNode.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </g>

                  {/* Nodes - rendered after edges so they appear on top */}
                  <g id="nodes">
                  {nodes.map((node) => (
                    <TooltipProvider key={node.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <g
                            onClick={() => handleNodeClick(node)}
                            className={`cursor-pointer transition-all ${node.type === 'source' ? 'hover:opacity-80' : 'hover:opacity-60'
                              } ${selectedNode?.id === node.id ? 'opacity-100' : ''}`}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={node.type === 'master' ? 35 : node.type === 'source' ? 25 : 20}
                              fill={node.type === 'master' ? '#FFD700' : node.type === 'source' ? '#10B981' : getPlatformColor(node.label)}
                              stroke={selectedNode?.id === node.id ? '#F59E0B' : node.type === 'master' ? '#FFA500' : '#2D3748'}
                              strokeWidth={selectedNode?.id === node.id ? 3 : node.type === 'master' ? 2.5 : 2}
                              className={node.type === 'master' ? 'hover:opacity-90 hover:stroke-yellow-400' : node.type === 'source' ? 'hover:fill-green-600 hover:stroke-green-400' : 'hover:opacity-90 hover:stroke-blue-400'}
                              style={{ filter: node.type === 'master' ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' : 'none' }}
                            />
                            {scale > 0.7 && (
                              <>
                                <text
                                  x={node.x}
                                  y={node.y}
                                  fill={node.type === 'master' ? '#000000' : 'white'}
                                  fontSize={`${Math.min(12, Math.max(8, 12 * scale))}`}
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="select-none pointer-events-none"
                                  style={{ 
                                    textShadow: node.type === 'master' ? 'none' : '1px 1px 2px rgba(0, 0, 0, 0.8)',
                                    filter: node.type === 'master' ? 'none' : 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.9))'
                                  }}
                                >
                                  {node.label.length > (12 / scale) ? node.label.substring(0, Math.floor(10 / scale)) + '...' : node.label}
                                </text>

                                {/* Display Post Text for Master Node - Positioned BELOW the node with proper spacing */}
                                {node.type === 'master' && node.data?.postText && (
                                  <>
                                    {/* Visual connector line from node to text box */}
                                    <line
                                      x1={node.x}
                                      y1={(node.y || 0) + 35}
                                      x2={node.x}
                                      y2={(node.y || 0) + 35 + 30}
                                      stroke="#6B7280"
                                      strokeWidth="1.5"
                                      strokeDasharray="4,4"
                                      opacity="0.5"
                                      className="pointer-events-none"
                                    />
                                    <foreignObject
                                      x={Math.max(0, Math.min((node.x || 0) - 125, 750))}
                                      y={(node.y || 0) + 35 + 60}
                                      width="250"
                                      height="180"
                                      className="pointer-events-none"
                                      style={{ overflow: 'visible' }}
                                    >
                                      <div className="flex flex-col gap-2 h-full" style={{ maxWidth: '250px', wordWrap: 'break-word' }}>
                                        <span className="text-yellow-400 font-bold text-sm mb-1">Main Post Text</span>
                                        <div className="flex-1 overflow-hidden">
                                          <p className="text-gray-200 text-xs leading-relaxed bg-gray-900/95 p-3 rounded-lg backdrop-blur-sm border border-yellow-500/30 shadow-lg break-words h-full overflow-y-auto">
                                            {node.data.postText}
                                          </p>
                                        </div>
                                      </div>
                                    </foreignObject>
                                  </>
                                )}
                              </>
                            )}
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-semibold">{node.label}</p>
                            <p className="text-sm text-gray-400">Type: {node.type}</p>
                            {node.data && (
                              <p className="text-sm text-gray-400">
                                Posts: {node.data.posts.length}
                                {node.type === 'source' && ' (click to view)'}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  </g>
                </svg>
              </div>
            </div>

            {/* Selected Node Info */}
            {selectedNode && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNode(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Type: <Badge variant="outline" className="border-gray-600 text-gray-300">{selectedNode.type}</Badge></p>
                    {selectedNode.data && (
                      <>
                        <p>Posts: {selectedNode.data.posts.length}</p>
                        {selectedNode.type === 'source' && (
                          <p className="text-xs text-blue-400">Click to view all posts from this source</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Posts Modal for Selected Source */}
      <Dialog open={showPostsModal} onOpenChange={setShowPostsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Posts from {selectedSource?.source}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedSource?.posts.length} posts with {formatNumber(selectedSource?.engagement || 0)} total engagement
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedSource?.posts.map((post: Post, index: number) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="space-y-3">
                    {/* Post Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-purple-600 text-purple-300">
                          {post.platform}
                        </Badge>
                        {post.sentiment && (
                          <Badge
                            variant="outline"
                            className={`${post.sentiment === 'positive'
                              ? 'border-green-600 text-green-400'
                              : post.sentiment === 'negative'
                                ? 'border-red-600 text-red-400'
                                : 'border-gray-600 text-gray-400'
                              }`}
                          >
                            {post.sentiment}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {dayjs(post.postDate).format('MMM DD, YYYY [at] HH:mm')}
                        {post.postLink && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          >
                            <a href={post.postLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Post Text */}
                    <div className="text-gray-300 leading-relaxed">
                      {post.postText}
                    </div>

                    {/* Engagement Metrics */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-medium">{formatNumber(post.reactions)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">{formatNumber(post.shares)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">{formatNumber(post.comments)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Network, MapPin, Building, User, Package, Search } from 'lucide-react'

interface Entity {
  text: string
  type: 'person' | 'location' | 'organization' | 'object'
  frequency: number
  contexts: string[]
}

interface EntityRelationship {
  entity1: string
  entity2: string
  strength: number
  contexts: string[]
}

interface EntityRelationshipGraphProps {
  posts: any[]
  width?: number
  height?: number
}

export function EntityRelationshipGraph({ posts, width = 700, height = 400 }: EntityRelationshipGraphProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [selectedRelationship, setSelectedRelationship] = useState<EntityRelationship | null>(null)
  const [entityType, setEntityType] = useState<'all' | 'person' | 'location' | 'organization' | 'object'>('all')

  // Extract entities from posts
  const { entities, relationships } = useMemo(() => {
    if (!posts || posts.length === 0) {
      return { entities: [], relationships: [] }
    }

    const entityMap = new Map<string, Entity>()
    const relationshipMap = new Map<string, EntityRelationship>()

    // Simple entity extraction
    posts.forEach(post => {
      const postText = post.postText || ''

      // Extract different types of entities
      const entityPatterns = {
        person: [/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g],
        location: [/\b(Dhaka|Chattogram|Sylhet|Rajshahi|Khulna|Barishal)\b/gi],
        organization: [/\b(Police|Army|Govt|Government|University)\b/gi]
      }

      Object.entries(entityPatterns).forEach(([type, patterns]) => {
        patterns.forEach(pattern => {
          const matches = postText.match(pattern)
          if (matches) {
            matches.forEach((match: string) => {
              const cleanMatch = match.trim()
              if (cleanMatch.length > 2 && cleanMatch.length < 50) {
                if (entityMap.has(cleanMatch)) {
                  const entity = entityMap.get(cleanMatch)!
                  entity.frequency++
                  if (!entity.contexts.includes(postText.substring(0, 100))) {
                    entity.contexts.push(postText.substring(0, 100))
                  }
                } else {
                  entityMap.set(cleanMatch, {
                    text: cleanMatch,
                    type: type as Entity['type'],
                    frequency: 1,
                    contexts: [postText.substring(0, 100)]
                  })
                }
              }
            })
          }
        })
      })
    })

    const allEntities = Array.from(entityMap.values())
      .filter(entity => entity.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)

    const allRelationships = Array.from(relationshipMap.values())
      .filter(rel => rel.strength >= 2)
      .sort((a, b) => b.strength - a.strength)

    return {
      entities: allEntities,
      relationships: allRelationships
    }
  }, [posts])

  const filteredEntities = entities.filter(entity =>
    entityType === 'all' || entity.type === entityType
  )

  const getEntityIcon = (type: Entity['type']) => {
    switch (type) {
      case 'person': return <User className="w-4 h-4" />
      case 'location': return <MapPin className="w-4 h-4" />
      case 'organization': return <Building className="w-4 h-4" />
      case 'object': return <Package className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getEntityColor = (type: Entity['type']) => {
    switch (type) {
      case 'person': return 'bg-blue-500'
      case 'location': return 'bg-green-500'
      case 'organization': return 'bg-purple-500'
      case 'object': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-green-400" />
          <CardTitle className="text-lg text-white">Entity Relationship Network</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as any)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Entities</option>
            <option value="person">People</option>
            <option value="location">Locations</option>
            <option value="organization">Organizations</option>
            <option value="object">Objects</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{entities.filter(e => e.type === 'person').length}</div>
              <div className="text-sm text-gray-400">People</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{entities.filter(e => e.type === 'location').length}</div>
              <div className="text-sm text-gray-400">Locations</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{entities.filter(e => e.type === 'organization').length}</div>
              <div className="text-sm text-gray-400">Organizations</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">{relationships.length}</div>
              <div className="text-sm text-gray-400">Relationships</div>
            </div>
          </div>

          {/* Entity List */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Top Entities ({filteredEntities.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEntities.slice(0, 6).map((entity, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="bg-gray-900 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                        onClick={() => setSelectedEntity(entity)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${getEntityColor(entity.type)}`}>
                              {getEntityIcon(entity.type)}
                            </div>
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              {entity.type}
                            </Badge>
                          </div>
                          <span className="text-white font-semibold">{entity.frequency}</span>
                        </div>
                        <div className="text-gray-300 text-sm truncate">{entity.text}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-2">
                        <p className="font-semibold">{entity.text}</p>
                        <p className="text-sm">Type: {entity.type}</p>
                        <p className="text-sm">Frequency: {entity.frequency}</p>
                        <p className="text-sm">Contexts: {entity.contexts.length}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { Heart, Share2, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HighlightMetrics {
  mostLiked: { value: number; text: string; source: string; postLink: string | null; fullText: string; sentiment: string }
  mostShared: { value: number; text: string; source: string; postLink: string | null; fullText: string; sentiment: string }
  mostCommented: { value: number; text: string; source: string; postLink: string | null; fullText: string; sentiment: string }
}

interface HighlightCardsProps {
  metrics: HighlightMetrics
}

export function HighlightCards({ metrics }: HighlightCardsProps) {
  const cards = [
    {
      title: "Most Liked",
      value: metrics.mostLiked.value,
      text: metrics.mostLiked.text,
      source: metrics.mostLiked.source,
      postLink: metrics.mostLiked.postLink,
      fullText: metrics.mostLiked.fullText,
      sentiment: metrics.mostLiked.sentiment,
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      title: "Most Shared",
      value: metrics.mostShared.value,
      text: metrics.mostShared.text,
      source: metrics.mostShared.source,
      postLink: metrics.mostShared.postLink,
      fullText: metrics.mostShared.fullText,
      sentiment: metrics.mostShared.sentiment,
      icon: Share2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Most Commented",
      value: metrics.mostCommented.value,
      text: metrics.mostCommented.text,
      source: metrics.mostCommented.source,
      postLink: metrics.mostCommented.postLink,
      fullText: metrics.mostCommented.fullText,
      sentiment: metrics.mostCommented.sentiment,
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <Card
            key={card.title}
            className={`bg-gray-900 border-gray-800 hover:${card.borderColor} transition-colors duration-200`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${card.color}`}>{card.value.toLocaleString()}</div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400 line-clamp-2" title={card.fullText}>
                    {card.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      card.sentiment === 'positive' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      card.sentiment === 'negative' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {card.sentiment.charAt(0).toUpperCase() + card.sentiment.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500">
                      Source: <span className="text-gray-400">{card.source}</span>
                    </p>
                  </div>
                  {card.postLink && (
                    <div className="pt-2">
                      <a
                        href={card.postLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-xs font-medium ${card.color} hover:opacity-80 transition-opacity`}
                      >
                        <span>View Original</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

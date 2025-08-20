"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp, PieChartIcon, BarChart3, Users, Target } from "lucide-react"

interface ChartData {
  newsFlow: Array<{ category: string; count: number; reactions: number; shares: number; comments: number }>
  sourceEngagement: Array<{ source: string; reactions: number; shares: number; comments: number }>
  categoryTrending: Array<{ category: string; posts: number }>
  categoryReactions: Array<{ category: string; reactions: number }>
  sentimentDistribution: Array<{ sentiment: string; count: number }>
}

interface ChartsSectionProps {
  chartData: ChartData
}

// Chart colors matching the theme
const CHART_COLORS = [
  "hsl(var(--chart-1))", // Blue
  "hsl(var(--chart-2))", // Green
  "hsl(var(--chart-3))", // Purple
  "hsl(var(--chart-4))", // Yellow
  "hsl(var(--chart-5))", // Orange
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6366F1", // Indigo
]

const ENGAGEMENT_COLORS = {
  reactions: "#EF4444", // Red
  shares: "#10B981", // Green
  comments: "#3B82F6", // Blue
}

export function ChartsSection({ chartData }: ChartsSectionProps) {
  // Custom tooltip component for dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices < 5%

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <BarChart3 className="h-6 w-6 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Analytics & Insights</h2>
      </div>

      {/* First Row - News Flow and Category Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News Flow Statistics (Pie Chart) */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              News Flow Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.newsFlow}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="category"
                >
                  {chartData.newsFlow.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: "#D1D5DB" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trending Posts by Category (Bar Chart) */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Trending Posts by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.categoryTrending} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
                <YAxis tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="posts" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Source Engagement (Full Width) */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Top Sources Engagement Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData.sourceEngagement.slice(0, 12)}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="source"
                tick={{ fill: "#D1D5DB", fontSize: 11 }}
                axisLine={{ stroke: "#6B7280" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: "#D1D5DB" }}
              />
              <Bar dataKey="reactions" stackId="a" fill={ENGAGEMENT_COLORS.reactions} name="Reactions" />
              <Bar dataKey="shares" stackId="a" fill={ENGAGEMENT_COLORS.shares} name="Shares" />
              <Bar dataKey="comments" stackId="a" fill={ENGAGEMENT_COLORS.comments} name="Comments" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Third Row - Average Trending Score, Category Reactions, and Sentiment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Trending Score by Category */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              Average Trending Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData.newsFlow.map((item) => ({
                  category: item.category,
                  avgScore: item.count > 0 ? (item.reactions + item.shares * 2 + item.comments * 3) / item.count : 0,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
                <YAxis tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgScore" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category-wise Reaction Statistics */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">♥</span>
              </div>
              Total Reactions by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.categoryReactions} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
                <YAxis tick={{ fill: "#D1D5DB", fontSize: 12 }} axisLine={{ stroke: "#6B7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="reactions" fill={ENGAGEMENT_COLORS.reactions} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">😊</span>
              </div>
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="sentiment"
                >
                  {chartData.sentimentDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.sentiment === 'positive' ? '#10B981' :
                        entry.sentiment === 'negative' ? '#EF4444' :
                        '#6B7280'
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: "#D1D5DB" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Categories</p>
                <p className="text-2xl font-bold text-white">{chartData.newsFlow.length}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <PieChartIcon className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Posts</p>
                <p className="text-2xl font-bold text-white">
                  {chartData.newsFlow.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Reactions</p>
                <p className="text-2xl font-bold text-red-400">
                  {chartData.newsFlow.reduce((sum, item) => sum + item.reactions, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">♥</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Sources</p>
                <p className="text-2xl font-bold text-white">{chartData.sourceEngagement.length}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

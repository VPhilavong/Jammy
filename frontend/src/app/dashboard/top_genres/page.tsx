"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
} from "recharts"
import { Search, Music, Hash, Filter, RefreshCw } from "lucide-react"

interface GenreData {
  name: string
  count: number
  category: string
  color: string
}

interface ApiResponse {
  genres: [string, number][]
  time_range: string
  total_unique_genres: number
  total_artists_analyzed: number
}

// Color palette for genres
const colors = [
  "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57",
  "#ff9ff3", "#54a0ff", "#5f27cd", "#00d2d3", "#ff6348",
  "#2ed573", "#ffa502", "#3742fa", "#ff4757", "#7bed9f",
  "#70a1ff", "#5352ed", "#ff6b9d", "#c44569", "#f8b500"
]

// Function to categorize genres
const categorizeGenre = (genreName: string): string => {
  const name = genreName.toLowerCase()
  if (name.includes('rock') || name.includes('punk') || name.includes('metal')) return 'Rock'
  if (name.includes('pop') || name.includes('indie pop')) return 'Pop'
  if (name.includes('hip hop') || name.includes('rap') || name.includes('trap')) return 'Hip Hop'
  if (name.includes('electronic') || name.includes('house') || name.includes('techno') || name.includes('ambient')) return 'Electronic'
  if (name.includes('jazz') || name.includes('blues')) return 'Jazz'
  if (name.includes('r&b') || name.includes('soul')) return 'R&B'
  if (name.includes('folk') || name.includes('country')) return 'Folk'
  if (name.includes('classical') || name.includes('orchestra')) return 'Classical'
  return 'Other'
}

export default function TopGenresPage() {
  const [genreData, setGenreData] = useState<GenreData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('medium_term')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchGenres = async (range: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/top_genres/?time_range=${range}&limit=50`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch genres: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      
      // Transform API data to component format
      const transformedData: GenreData[] = data.genres.map(([name, count], index) => ({
        name,
        count,
        category: categorizeGenre(name),
        color: colors[index % colors.length]
      }))
      
      setGenreData(transformedData)
    } catch (err) {
      console.error('Error fetching genres:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGenres(timeRange)
  }, [timeRange])

  const filteredGenres = genreData.filter(
    (genre) =>
      genre.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === null || genre.category === selectedCategory)
  )

  const categories = [...new Set(genreData.map((g) => g.category))]
  const totalGenres = genreData.length
  const totalCount = genreData.reduce((sum, g) => sum + g.count, 0)

  // Group by category for treemap
  const categoryData = genreData.reduce((acc, genre) => {
    const existing = acc.find((item) => item.name === genre.category)
    if (existing) {
      existing.value += genre.count
      existing.children.push({
        name: genre.name,
        value: genre.count,
        color: genre.color,
      })
    } else {
      acc.push({
        name: genre.category,
        value: genre.count,
        children: [
          {
            name: genre.name,
            value: genre.count,
            color: genre.color,
          },
        ],
      })
    }
    return acc
  }, [] as any[])

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case 'short_term': return 'Last 4 Weeks'
      case 'medium_term': return 'Last 6 Months'
      case 'long_term': return 'All Time'
      default: return 'Last 6 Months'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading your top genres...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <Button onClick={() => fetchGenres(timeRange)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-medium text-white tracking-tight">Top Genres</h1>
          <p className="text-slate-300 text-lg">Explore your music collection by genre</p>
          
          {/* Time Range Selector */}
          <div className="flex justify-center gap-2">
            {['short_term', 'medium_term', 'long_term'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {getTimeRangeLabel(range)}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Music className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalGenres}</p>
                  <p className="text-slate-400 text-sm">Total Genres</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Hash className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalCount.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">Total Artists</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{categories.length}</p>
                  <p className="text-slate-400 text-sm">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="grid" className="data-[state=active]:bg-slate-700">
              Grid View
            </TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:bg-slate-700">
              Charts
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-slate-700">
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6">
            {/* Genre Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredGenres.map((genre, index) => (
                <Card
                  key={genre.name}
                  className="border-slate-700 hover:scale-105 transition-all cursor-pointer group"
                  style={{
                    backgroundColor: genre.color,
                    borderColor: `${genre.color}`,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white text-black border-white">#{index + 1}</Badge>
                        <Badge className="bg-white text-black border-white text-xs">{genre.category}</Badge>
                      </div>

                      <div className="text-center">
                        <h3 className="font-semibold text-white text-sm leading-tight">{genre.name}</h3>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{genre.count}</p>
                        <p className="text-white/80 text-xs">artists</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {/* Bar Chart */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Top 15 Genres by Artist Count</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={genreData.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#8884d8">
                      {genreData.slice(0, 15).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Genre Distribution (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={genreData.slice(0, 10)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {genreData.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Category Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const categoryGenres = genreData.filter((g) => g.category === category)
                const categoryTotal = categoryGenres.reduce((sum, g) => sum + g.count, 0)

                return (
                  <Card key={category} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white">{categoryTotal}</p>
                        <p className="text-slate-400 text-sm">total artists</p>
                        <p className="text-slate-400 text-sm">{categoryGenres.length} genres</p>
                      </div>
                      <div className="space-y-2">
                        {categoryGenres.slice(0, 3).map((genre) => (
                          <div key={genre.name} className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{genre.name}</span>
                            <span className="text-sm text-white font-medium">{genre.count}</span>
                          </div>
                        ))}
                        {categoryGenres.length > 3 && (
                          <p className="text-xs text-slate-400 text-center">+{categoryGenres.length - 3} more</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Treemap */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Genre Hierarchy</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <Treemap data={categoryData} dataKey="value" aspectRatio={4 / 3} stroke="#374151" fill="#8884d8" />
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
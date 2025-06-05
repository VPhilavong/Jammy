"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { X } from "lucide-react"

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
  spotify_genres: [string, number][]
  wikipedia_genres: [string, number][]
  artists_genre_map: {
    [artistName: string]: {
      spotify_genres: string[]
      wikipedia_genres: string[]
      spotify_id: string
      popularity: number
    }
  }
}

interface Artist {
  id: string
  name: string
  image_url?: string
}

// Color palette for genres - updated to match theme
const colors = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#feca57",
  "#ff9ff3",
  "#54a0ff",
  "#5f27cd",
  "#00d2d3",
  "#ff6348",
  "#2ed573",
  "#ffa502",
  "#3742fa",
  "#ff4757",
  "#7bed9f",
  "#70a1ff",
  "#5352ed",
  "#ff6b9d",
  "#c44569",
  "#f8b500",
]

// Function to categorize genres
const categorizeGenre = (genreName: string): string => {
  const name = genreName.toLowerCase()
  if (name.includes("rock") || name.includes("punk") || name.includes("metal")) return "Rock"
  if (name.includes("pop") || name.includes("indie pop")) return "Pop"
  if (name.includes("hip hop") || name.includes("rap") || name.includes("trap")) return "Hip Hop"
  if (name.includes("electronic") || name.includes("house") || name.includes("techno") || name.includes("ambient"))
    return "Electronic"
  if (name.includes("jazz") || name.includes("blues")) return "Jazz"
  if (name.includes("r&b") || name.includes("soul")) return "R&B"
  if (name.includes("folk") || name.includes("country")) return "Folk"
  if (name.includes("classical") || name.includes("orchestra")) return "Classical"
  return "Other"
}

const CACHE_KEY = "topGenres"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function TopGenresPage() {
  const [genreData, setGenreData] = useState<GenreData[]>([])
  const [artistsGenreMap, setArtistsGenreMap] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("medium_term")
  const [cachedData, setCachedData] = useState<GenreData[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [genreArtists, setGenreArtists] = useState<Artist[]>([])
  const [loadingArtists, setLoadingArtists] = useState(false)

  const getCachedData = (range: string) => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${range}`)
      if (cached) {
        const parsedData = JSON.parse(cached)
        const isExpired = Date.now() - parsedData.timestamp > CACHE_DURATION

        if (!isExpired) {
          return parsedData.data
        }
      }
    } catch (error) {
      console.error("Failed to get cached data:", error)
    }
    return null
  }

  const setCacheData = (data: GenreData[], range: string) => {
    try {
      localStorage.setItem(
        `${CACHE_KEY}_${range}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )
    } catch (error) {
      console.error("Failed to cache data:", error)
    }
  }

  const fetchGenres = async (range: string) => {
    // Only show loading if we don't have cached data
    if (cachedData.length === 0) {
      setLoading(true)
    }
    setError(null)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const response = await fetch(`${backendUrl}/top_genres/?time_range=${range}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch genres: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log(data)

      // Store the artists genre map
      setArtistsGenreMap(data.artists_genre_map || {})

      // Use combined_genres from the actual response structure
      const genresArray = data.genres || []

      if (!Array.isArray(genresArray)) {
        throw new Error("No valid genres array found in response")
      }

      // Transform API data to component format
      const transformedData: GenreData[] = genresArray.map(([name, count], index) => ({
        name,
        count,
        category: categorizeGenre(name),
        color: colors[index % colors.length],
      }))

      setGenreData(transformedData)
      setCacheData(transformedData, range)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching genres:", err)
      // Only show error if we don't have cached data
      if (cachedData.length === 0) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Try to load from cache first
    const cached = getCachedData(timeRange)
    if (cached) {
      setGenreData(cached)
      setCachedData(cached)
      setLoading(false)
    }

    // Always fetch fresh data in background
    fetchGenres(timeRange)
  }, [timeRange])

  // Skeleton Components
  const SkeletonCard = () => (
    <Card className="bg-muted/20 backdrop-blur-sm border-border">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-8 bg-muted/40 rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted/40 rounded animate-pulse" />
          </div>
          <div className="text-center">
            <div className="h-4 bg-muted/40 rounded animate-pulse w-3/4 mx-auto" />
          </div>
          <div className="text-center">
            <div className="h-8 w-12 bg-muted/40 rounded animate-pulse mx-auto mb-1" />
            <div className="h-3 w-8 bg-muted/30 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const SkeletonStats = () => (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-muted/40 rounded animate-pulse" />
          <div>
            <div className="h-6 w-12 bg-muted/40 rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const SkeletonChart = () => (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="h-5 w-48 bg-muted/40 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-96 bg-muted/30 rounded animate-pulse" />
      </CardContent>
    </Card>
  )

  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-foreground text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground text-sm mb-6">{message}</p>
            <Button onClick={onRetry} className="px-6 py-3">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Define all possible categories - these will always show regardless of data
  const allCategories = ["Rock", "Pop", "Hip Hop", "Electronic", "Jazz", "R&B", "Folk", "Classical", "Other"]

  // Filter genres based on selected category
  const filteredGenres = selectedCategory ? genreData.filter((genre) => genre.category === selectedCategory) : genreData

  const categories = [...new Set(genreData.map((g) => g.category))]
  const totalGenres = filteredGenres.length
  const totalCount = filteredGenres.reduce((sum, g) => sum + g.count, 0)

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
      case "short_term":
        return "Last 4 Weeks"
      case "medium_term":
        return "Last 6 Months"
      case "long_term":
        return "All Time"
      default:
        return "Last 6 Months"
    }
  }

  const handleGenreClick = (genreName: string) => {
    setSelectedGenre(genreName)
    setLoadingArtists(true)

    try {
      // Find artists that have this genre (case-insensitive)
      const matchingArtists: Artist[] = []

      Object.entries(artistsGenreMap).forEach(([artistName, artistData]) => {
        const { spotify_genres, wikipedia_genres, spotify_id, popularity, image_url } = artistData as any

        // Check both Spotify and Wikipedia genres (case-insensitive)
        const hasSpotifyGenre = spotify_genres.some((genre: string) =>
          genre.toLowerCase() === genreName.toLowerCase()
        )
        const hasWikipediaGenre = wikipedia_genres.some((genre: string) =>
          genre.toLowerCase() === genreName.toLowerCase()
        )

        if (hasSpotifyGenre || hasWikipediaGenre) {
          matchingArtists.push({
            id: spotify_id,
            name: artistName,
            image_url: image_url || "", // Use the image URL from the API response
          })
        }
      })

      console.log(`Found ${matchingArtists.length} artists for genre "${genreName}":`, matchingArtists.map(a => a.name))
      setGenreArtists(matchingArtists)
    } catch (err) {
      console.error("Error filtering genre artists:", err)
      setGenreArtists([])
    } finally {
      setLoadingArtists(false)
    }
  }

  if (loading && cachedData.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Same background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 py-12">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
              <div className="h-12 w-64 bg-muted/40 rounded animate-pulse mx-auto" />
              <div className="h-5 w-80 bg-muted/30 rounded animate-pulse mx-auto" />

              {/* Time Range Selector Skeleton */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-8 w-24 bg-muted/40 rounded animate-pulse" />
                ))}
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-6">
              <div className="flex gap-2 bg-muted p-1 rounded">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-8 w-24 bg-muted/40 rounded animate-pulse" />
                ))}
              </div>

              {/* Genre Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 20 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && cachedData.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchGenres(timeRange)} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Add consistent background elements like other pages */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-8 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-medium text-foreground tracking-tight">Top Genres</h1>
            <p className="text-muted-foreground text-lg">Explore your music collection by genre</p>

            {/* Time Range Selector */}
            <div className="flex justify-center gap-2">
              {["short_term", "medium_term", "long_term"].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={
                    timeRange === range
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                  }
                >
                  {getTimeRangeLabel(range)}
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="grid" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="bg-muted border-border">
                <TabsTrigger
                  value="grid"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Grid View
                </TabsTrigger>
                <TabsTrigger
                  value="charts"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Charts
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Categories
                </TabsTrigger>
              </TabsList>

              {/* Category Filter Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={selectedCategory === null ? "default" : "secondary"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Badge>
                {allCategories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "secondary"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <TabsContent value="grid" className="space-y-6">
              {/* Genre Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredGenres.slice(0, 15).map((genre, index) => (
                  <Card
                    key={genre.name}
                    className="border-border hover:scale-105 transition-all cursor-pointer group hover:border-primary/40"
                    style={{
                      backgroundColor: genre.color,
                      borderColor: `${genre.color}`,
                    }}
                    onClick={() => handleGenreClick(genre.name)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-background text-foreground border-background">#{index + 1}</Badge>
                          <Badge className="bg-background text-foreground border-background text-xs">
                            {genre.category}
                          </Badge>
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

              {/* Show message if no genres found for selected category */}
              {selectedCategory && filteredGenres.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No genres found in the {selectedCategory} category for this time period.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              {/* Bar Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Top 15 Genres by Artist Count
                    {selectedCategory && ` - ${selectedCategory}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={filteredGenres.slice(0, 15)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--popover-foreground))",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelStyle={{
                          color: "hsl(var(--popover-foreground))",
                          fontWeight: "600",
                        }}
                        itemStyle={{
                          color: "hsl(var(--popover-foreground))",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))">
                        {filteredGenres.slice(0, 15).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Genre Distribution (Top 10)
                    {selectedCategory && ` - ${selectedCategory}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={filteredGenres.slice(0, 10)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="hsl(var(--primary))"
                        dataKey="count"
                      >
                        {filteredGenres.slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--popover-foreground))",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelStyle={{
                          color: "hsl(var(--popover-foreground))",
                          fontWeight: "600",
                        }}
                        itemStyle={{
                          color: "hsl(var(--popover-foreground))",
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
                    <Card key={category} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground text-lg">{category}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-foreground">{categoryTotal}</p>
                          <p className="text-muted-foreground text-sm">total artists</p>
                          <p className="text-muted-foreground text-sm">{categoryGenres.length} genres</p>
                        </div>
                        <div className="space-y-2">
                          {categoryGenres.slice(0, 3).map((genre) => (
                            <div key={genre.name} className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{genre.name}</span>
                              <span className="text-sm text-foreground font-medium">{genre.count}</span>
                            </div>
                          ))}
                          {categoryGenres.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{categoryGenres.length - 3} more
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Treemap */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Genre Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <Treemap
                      data={categoryData}
                      dataKey="value"
                      aspectRatio={4 / 3}
                      stroke="hsl(var(--border))"
                      fill="hsl(var(--primary))"
                    />
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Genre Artists Dialog */}
      <Dialog open={selectedGenre !== null} onOpenChange={(open) => !open && setSelectedGenre(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedGenre}
            </DialogTitle>
            <DialogDescription>
              Artists in this genre from your {getTimeRangeLabel(timeRange)} listening
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {loadingArtists ? (
              <div className="space-y-4 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted/40 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : genreArtists.length > 0 ? (
              <div className="space-y-4 p-2">
                {genreArtists.map((artist) => (
                  <div key={artist.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error(`Failed to load image for ${artist.name}: ${artist.image_url}`)
                            // Show fallback when image fails to load
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className="bg-muted h-full w-full flex items-center justify-center"
                        style={{ display: artist.image_url ? 'none' : 'flex' }}
                      >
                        <span className="text-xs text-muted-foreground font-medium">
                          {artist.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{artist.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No artists found for this genre</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

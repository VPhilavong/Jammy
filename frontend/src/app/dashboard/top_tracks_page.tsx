"use client"
import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Heart, MoreHorizontal } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

interface Artist {
  name: string
  images?: { url: string; height: number; width: number }[]
  external_urls?: { spotify: string }
}

interface Track {
  id: string
  name: string
  artists: Artist[]
  album: {
    name: string
    images: { url: string; height: number; width: number }[]
  }
  genres?: string[]
  popularity: number
  duration_ms: number
  external_urls: { spotify: string }
  preview_url?: string
}

interface ApiResponse {
  items: Track[]
  total: number
  limit: number
  offset: number
}

type LoadingState = "idle" | "loading" | "success" | "error"

const CACHE_KEY = "topTracks"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export default function TopTracksPage(): React.JSX.Element {
  const [tracks, setTracks] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("medium_term")
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null)
  const [artistsLoading, setArtistsLoading] = useState<boolean>(false)
  const [artistsData, setArtistsData] = useState<Record<string, any>>({})
  const [cachedData, setCachedData] = useState<Track[]>([])

  const formatDuration = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const getArtistImage = useCallback(
    (artist: Artist): string | null => {
      // First check if we have fetched artist data
      const fetchedArtist = artistsData[artist.name]
      if (fetchedArtist && fetchedArtist.images && fetchedArtist.images.length > 0) {
        return fetchedArtist.images[0].url
      }

      // Fallback to track artist images if available
      if (artist.images && artist.images.length > 0) {
        return artist.images[0].url
      }

      return null
    },
    [artistsData],
  )

  const fetchArtistDetails = useCallback(async (tracks: Track[]): Promise<void> => {
    setArtistsLoading(true)

    try {
      // Collect unique artist names from all tracks
      const uniqueArtistNames = new Set<string>()
      tracks.forEach((track) => {
        track.artists.forEach((artist) => {
          uniqueArtistNames.add(artist.name)
        })
      })

      if (uniqueArtistNames.size > 0) {
        const artistsResponse = await fetch(`${backendUrl}/artists/bulk-cached/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artist_names: Array.from(uniqueArtistNames),
          }),
        })

        if (artistsResponse.ok) {
          const fetchedArtistsData = await artistsResponse.json()
          setArtistsData(fetchedArtistsData)
        } else {
          console.error("Failed to fetch artists:", await artistsResponse.text())
        }
      }
    } catch (err) {
      console.error("Failed to fetch artist details:", err)
    } finally {
      setArtistsLoading(false)
    }
  }, [])

  const getCachedData = useCallback((range: string) => {
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
  }, [])

  const setCacheData = useCallback((data: Track[], range: string) => {
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
  }, [])

  const fetchTopTracks = useCallback(async (range: string): Promise<void> => {
    // Only show loading if we don't have cached data
    if (cachedData.length === 0) {
      setLoadingState("loading")
    }
    setError(null)

    try {
      const response = await fetch(`${backendUrl}/top_tracks/?time_range=${range}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse = await response.json()

      // Update tracks and cache
      setTracks(data.items || [])
      setCacheData(data.items || [], range)
      setLoadingState("success")

      // Fetch artist details
      if (data.items && data.items.length > 0) {
        fetchArtistDetails(data.items)
      }
    } catch (err) {
      // Only show error if we don't have cached data
      if (cachedData.length === 0) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
        setError(errorMessage)
        setLoadingState("error")
      }
    }
  }, [cachedData.length, fetchArtistDetails, setCacheData])

  useEffect(() => {
    // Try to load from cache first
    const cached = getCachedData(timeRange)
    if (cached) {
      setTracks(cached)
      setCachedData(cached)
      setLoadingState("success")

      // Fetch artist details for cached data
      if (cached.length > 0) {
        fetchArtistDetails(cached)
      }
    }

    // Always fetch fresh data in background
    fetchTopTracks(timeRange)
  }, [timeRange, getCachedData, fetchTopTracks, fetchArtistDetails])

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

  const SkeletonCard = (): React.JSX.Element => (
    <div className="bg-muted/20 backdrop-blur-sm rounded-lg p-4 border border-border">
      <div className="relative mb-4">
        <div className="aspect-square rounded-md bg-muted/40 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-muted/40 rounded animate-pulse" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-3/4" />
        </div>

        {/* Artist avatars skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-12 bg-muted/30 rounded animate-pulse" />
            <div className="flex -space-x-1">
              <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="h-2 bg-muted/30 rounded animate-pulse" />
            <div className="w-full bg-muted/40 rounded-full h-1" />
          </div>
          <div className="text-right space-y-1">
            <div className="h-2 bg-muted/30 rounded animate-pulse w-12 ml-auto" />
            <div className="h-3 bg-muted/40 rounded animate-pulse w-16 ml-auto" />
          </div>
        </div>

        {/* Genres skeleton */}
        <div className="flex flex-wrap gap-1 pt-1">
          <div className="h-6 w-12 bg-muted/30 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-muted/30 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )

  const LoadingGrid = (): React.JSX.Element => (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <div className="h-6 bg-muted/40 rounded animate-pulse w-64 mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {Array.from({ length: 20 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  )

  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }): React.JSX.Element => (
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

  const SkeletonAvatar = (): React.JSX.Element => (
    <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse flex-shrink-0" />
  )

  const ArtistAvatar = ({ artist }: { artist: Artist }): React.JSX.Element => {
    const artistImage = getArtistImage(artist)
    const hasArtistData = artistsData[artist.name]

    // Show skeleton while artist data is loading
    if (artistsLoading && !hasArtistData) {
      return <SkeletonAvatar />
    }

    return (
      <div
        className="w-8 h-8 rounded-full border border-border overflow-hidden bg-muted/40 flex-shrink-0 transition-all duration-300"
        title={artist.name}
      >
        {artistImage ? (
          <Image
            src={artistImage || "/placeholder.svg"}
            alt={artist.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            width={32}
            height={32}
            loading="eager"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7XQAT3Bwt+X1Kmi9DowBwkOtGjTK6ioJ7lpj2sA9JLTFSGJNUFdyJTEj+uXfQP/9k="
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-foreground text-xs font-medium">{artist.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    )
  }

  const TrackCard = ({ track, index }: { track: Track; index: number }): React.JSX.Element => (
    <div
      className="group relative bg-card/80 hover:bg-accent/50 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 cursor-pointer border border-border hover:border-primary/40"
      onMouseEnter={() => setHoveredTrack(track.id)}
      onMouseLeave={() => setHoveredTrack(null)}
    >
      {/* Rank Badge */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg border border-border">
          #{index + 1}
        </div>
      </div>

      {/* Album Art */}
      <div className="relative mb-4">
        <div className="aspect-square rounded-md overflow-hidden bg-muted shadow-lg ring-1 ring-border">
          {track.album.images?.[0]?.url ? (
            <Image
              src={track.album.images[0].url || "/placeholder.svg"}
              alt={`${track.name} album cover`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              width={300}
              height={300}
              loading="eager"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7XQAT3Bwt+X1Kmi9DowBwkOtGjTK6ioJ7lpj2sA9JLTFSGJNUFdyJTEj+uXfQP/9k="
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg className="w-12 h-12 text-muted-foreground/50" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Play Button Overlay */}
        <div
          className={`absolute bottom-2 right-2 transition-all duration-300 ${
            hoveredTrack === track.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <Button
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-12 h-12 shadow-lg"
          >
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Track Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-foreground font-semibold text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {track.name}
          </h3>
          <p className="text-muted-foreground text-sm font-normal">{track.artists.map((artist) => artist.name).join(", ")}</p>
        </div>

        {/* Artist Avatars */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Artists</span>
            <div className="flex -space-x-1">
              {track.artists.slice(0, 3).map((artist, artistIndex) => (
                <ArtistAvatar key={artistIndex} artist={artist} />
              ))}
              {track.artists.length > 3 && (
                <div className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center text-xs text-foreground font-medium">
                  +{track.artists.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {track.external_urls?.spotify && (
              <a
                href={track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-1"
                title="Open in Spotify"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.479.179-.66.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02v-.12zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.12 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </a>
            )}
            <div
              className={`flex items-center space-x-1 transition-opacity duration-200 ${
                hoveredTrack === track.id ? "opacity-100" : "opacity-0"
              }`}
            >
              
            </div>
          </div>
        </div>

        {/* Track Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Popularity</span>
              <span>{track.popularity}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-accent h-1 rounded-full transition-all duration-1000"
                style={{ width: `${track.popularity}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="text-foreground font-mono text-sm font-medium">{formatDuration(track.duration_ms)}</p>
          </div>
        </div>

        {/* Genres */}
        {track.genres && track.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {track.genres.slice(0, 2).map((genre, genreIndex) => (
              <span
                key={genreIndex}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium border border-border"
              >
                {genre}
              </span>
            ))}
            {track.genres.length > 2 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                +{track.genres.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (loadingState === "loading") {
    return <LoadingGrid />
  }

  if (loadingState === "error") {
    return <ErrorState message={error || "Unknown error"} onRetry={() => fetchTopTracks(timeRange)} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-5xl font-medium text-foreground tracking-tight">Top Tracks</h1>
          <p className="text-muted-foreground text-lg font-medium">
            Showing your top <span className="font-bold text-primary">{tracks.length}</span> tracks
          </p>
          
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {tracks.map((track, index) => (
            <TrackCard key={track.id} track={track} index={index} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.479.179-.66.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02v-.12zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.12 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-muted-foreground font-medium">Powered by Spotify</span>
            </div>
            <p className="text-muted-foreground text-sm">Your music, beautifully displayed</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

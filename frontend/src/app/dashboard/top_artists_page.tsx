"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Heart, MoreHorizontal, Users } from "lucide-react"
import Image from "next/image"
import type { JSX } from "react/jsx-runtime"

interface Artist {
  name: string
  genres: string[]
  images: { url: string; height?: number; width?: number }[]
  external_urls?: { spotify: string }
  popularity?: number
  followers?: { total: number }
}

interface ApiResponse {
  items: Artist[]
  total?: number
  limit?: number
  offset?: number
}

type LoadingState = "idle" | "loading" | "success" | "error"

const CACHE_KEY = "topArtists"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function TopArtistsPage(): JSX.Element {
  const [artists, setArtists] = useState<Artist[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")
  const [hoveredArtist, setHoveredArtist] = useState<string | null>(null)
  const [cachedData, setCachedData] = useState<Artist[]>([])

  const formatFollowers = useCallback((count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }, [])

  const getArtistImage = useCallback((artist: Artist): string | null => {
    return artist.images?.[0]?.url || null
  }, [])

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
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

  const setCacheData = useCallback((data: Artist[]) => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )
    } catch (error) {
      console.error("Failed to cache data:", error)
    }
  }, [])

  const fetchTopArtists = useCallback(async (): Promise<void> => {
    // Only show loading if we don't have cached data
    if (cachedData.length === 0) {
      setLoadingState("loading")
    }
    setError(null)

    try {
      const response = await fetch("http://localhost:8000/top_artists", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch artists: ${response.status} ${response.statusText}`)
      }

      const data: ApiResponse = await response.json()

      // Update artists and cache
      setArtists(data.items || [])
      setCacheData(data.items || [])
      setLoadingState("success")
    } catch (err) {
      // Only show error if we don't have cached data
      if (cachedData.length === 0) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
        setError(errorMessage)
        setLoadingState("error")
      }
    }
  }, [cachedData.length, setCacheData])

  useEffect(() => {
    // Try to load from cache first
    const cached = getCachedData()
    if (cached) {
      setArtists(cached)
      setCachedData(cached)
      setLoadingState("success")
    }

    // Always fetch fresh data in background
    fetchTopArtists()
  }, [getCachedData, fetchTopArtists])

  const SkeletonCard = (): JSX.Element => (
    <div className="bg-sage/10 backdrop-blur-sm rounded-lg p-4 border border-sage/20">
      <div className="relative mb-4">
        <div className="aspect-square rounded-full bg-sage/20 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-sage/20 rounded animate-pulse" />
        <div className="h-3 bg-sage/15 rounded animate-pulse w-3/4 mx-auto" />
        <div className="flex justify-center space-x-1">
          <div className="h-6 w-12 bg-sage/15 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-sage/15 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )

  const LoadingGrid = (): JSX.Element => (
    <div className="min-h-screen bg-cream text-dark-green">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-copper/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <div className="h-6 bg-sage/20 rounded animate-pulse w-64 mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {Array.from({ length: 20 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  )

  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }): JSX.Element => (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="bg-gradient-to-r from-copper/90 to-gold/90 backdrop-blur-sm border border-copper/50 rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-copper/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-cream text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-cream text-sm mb-6">{message}</p>
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-cream hover:bg-cream-dark text-dark-green font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const ArtistCard = ({ artist, index }: { artist: Artist; index: number }): JSX.Element => (
    <div
      className="group relative bg-sage/10 hover:bg-sage/15 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 cursor-pointer border border-sage/20 hover:border-gold/40"
      onMouseEnter={() => setHoveredArtist(artist.name)}
      onMouseLeave={() => setHoveredArtist(null)}
    >
      {/* Rank Badge */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className="bg-sage-light text-cream rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg border border-sage/30">
          #{index + 1}
        </div>
      </div>

      {/* Artist Image */}
      <div className="relative mb-4">
        <div className="aspect-square rounded-full overflow-hidden bg-sage/20 shadow-lg ring-1 ring-sage/30">
          {getArtistImage(artist) ? (
            <Image
              src={getArtistImage(artist)! || "/placeholder.svg"}
              alt={`${artist.name} profile`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              width={200}
              height={200}
              loading="eager"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7XQAT3Bwt+X1Kmi9DowBwkOtGjTK6ioJ7lpj2sA9JLTFSGJNUFdyJTEj+uXfQP/9k="
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-copper to-dark-green flex items-center justify-center">
              <svg className="w-12 h-12 text-cream/50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Play Button Overlay */}
        <div
          className={`absolute bottom-2 right-2 transition-all duration-300 ${
            hoveredArtist === artist.name ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <Button
            size="icon"
            className="bg-gold hover:bg-gold-dark text-dark-green rounded-full w-12 h-12 shadow-lg border border-gold/20"
          >
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Artist Info */}
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-dark-green font-semibold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-sage transition-colors">
            {artist.name}
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-2">
          {/* Spotify Link */}
          {artist.external_urls?.spotify && (
            <a
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage hover:text-green-400 transition-colors p-2 rounded-full hover:bg-sage/20"
              title="Open in Spotify"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.479.179-.66.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02v-.12zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.12 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </a>
          )}
          <div
            className={`flex items-center space-x-1 transition-opacity duration-200 ${
              hoveredArtist === artist.name ? "opacity-100" : "opacity-0"
            }`}
          >
            <Button variant="ghost" size="icon" className="text-sage hover:text-gold w-8 h-8">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-sage hover:text-gold w-8 h-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Artist Stats */}
        {(artist.popularity !== undefined || artist.followers) && (
          <div className="grid grid-cols-1 gap-3">
            {artist.popularity !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-sage">
                  <span>Popularity</span>
                  <span>{artist.popularity}%</span>
                </div>
                <div className="w-full bg-sage/20 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-gold to-copper h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${artist.popularity}%` }}
                  />
                </div>
              </div>
            )}
            {artist.followers && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-sage">
                  <Users className="w-3 h-3" />
                  <span className="text-xs font-medium">{formatFollowers(artist.followers.total)} followers</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Genres */}
        {artist.genres && artist.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 justify-center">
            {artist.genres.slice(0, 3).map((genre, genreIndex) => (
              <span
                key={genreIndex}
                className="bg-sage-light text-cream px-2 py-1 rounded-full text-xs font-medium border border-sage/30 hover:bg-sage hover:scale-105 transition-all duration-200"
              >
                {genre}
              </span>
            ))}
            {artist.genres.length > 3 && (
              <span className="bg-sage-light text-cream px-2 py-1 rounded-full text-xs border border-sage/30">
                +{artist.genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (loadingState === "loading" && cachedData.length === 0) {
    return <LoadingGrid />
  }

  if (loadingState === "error" && cachedData.length === 0) {
    return <ErrorState message={error || "Unknown error"} onRetry={fetchTopArtists} />
  }

  return (
    <div className="min-h-screen bg-cream text-dark-green">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-copper/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <p className="text-dark-green text-lg font-medium">
            Showing your top <span className="font-bold text-sage">{artists.length}</span> artists
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {artists.map((artist, index) => (
            <ArtistCard key={artist.name} artist={artist} index={index} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-sage/30 mt-16">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-6 h-6 text-sage" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.479.179-.66.479-.66 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02v-.12zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.12 10.561 18.72 12.84c.361.181.481.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-sage font-medium">Powered by Spotify</span>
            </div>
            <p className="text-sage text-sm">Your music, beautifully displayed</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

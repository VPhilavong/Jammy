"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export default function MinimalLoginPage() {
  const handleSpotifyLogin = () => {
    window.open(`${backendUrl}/login/`, '_self')
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex">
      {/* Left side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="mb-16">
            <div className="mb-8">
              <span className="text-xl font-semibold text-white">Jammy</span>
            </div>
          </div>

          {/* Welcome section */}
          <div className="mb-12">
            <h1 className="text-4xl font-light text-white mb-3 tracking-tight">Welcome back</h1>
            <p className="text-gray-400 text-lg">Sign in to continue</p>
          </div>

          {/* Login form */}
          <div className="space-y-4">
            <Button
              onClick={handleSpotifyLogin}
              className="w-full h-14 bg-[#4ade80] hover:bg-[#22c55e] text-[#1a1f2e] font-medium rounded-lg transition-colors duration-200"
            >
              <Image src="/spotify_logo.png" alt="Spotify Logo" width={24} height={24} className="mr-3" />
              Continue with Spotify
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1a1f2e] text-gray-400">or</span>
              </div>
            </div>

            <Link href="https://www.spotify.com/us/signup" className="block w-full">
              <Button
                variant="outline"
                className="w-full h-14 border border-gray-600 text-white hover:bg-gray-800/50 font-medium rounded-lg transition-colors duration-200"
              >
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Visual content */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#232937] items-center justify-center p-16">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-light text-white mb-4 tracking-tight">Your music, simplified</h2>

          <p className="text-gray-400 text-lg leading-relaxed mb-12">Discover your top genres, artists, and tracks.</p>

          {/* Simple stats */}
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-light text-white mb-1">50M+</div>
              <div className="text-sm text-gray-400">Songs</div>
            </div>
            <div>
              <div className="text-2xl font-light text-white mb-1">1M+</div>
              <div className="text-sm text-gray-400">Artists</div>
            </div>
            <div>
              <div className="text-2xl font-light text-white mb-1">24/7</div>
              <div className="text-sm text-gray-400">Streaming</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

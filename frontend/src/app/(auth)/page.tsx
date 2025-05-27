"use client"

import Link from "next/link"
import Image from "next/image"
import { Music, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const handleSpotifyLogin = () => {
    window.location.href = "http://localhost:8000/login"
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, #25344F 0%, #617891 100%)` }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div
          className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl animate-pulse opacity-30"
          style={{ backgroundColor: "#D5B893" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 opacity-20"
          style={{ backgroundColor: "#6F4D38" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl animate-pulse delay-500 opacity-25"
          style={{ backgroundColor: "#632024" }}
        ></div>
      </div>

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(213, 184, 147, 0.1) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      ></div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Login Form */}
        <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            {/* Logo and branding */}
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg"
                style={{ background: `linear-gradient(135deg, #D5B893 0%, #6F4D38 100%)` }}
              >
                <Music className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Jammy</h1>
              <p className="text-sm" style={{ color: "#D5B893" }}>
                Your music, your vibe
              </p>
            </div>

            {/* Welcome section */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-3">Welcome back</h2>
              <p className="text-lg" style={{ color: "#D5B893" }}>
                Continue your musical journey
              </p>
            </div>

            {/* Login form */}
            <div className="space-y-6">
              <Button
                onClick={handleSpotifyLogin}
                className="w-full h-14 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Image src="/spotify_logo.png" alt="Spotify Logo" width={24} height={24} className="mr-3" />
                Continue with Spotify
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: "#617891" }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent" style={{ color: "#D5B893" }}>
                    New to Jammy?
                  </span>
                </div>
              </div>

              <Link href="https://www.spotify.com/us/signup" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full h-14 border-2 text-white hover:text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 bg-transparent"
                  style={{
                    borderColor: "#D5B893",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(213, 184, 147, 0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <Sparkles className="mr-3 h-5 w-5" />
                  Create Spotify Account
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Visual content */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
          <div className="relative">
            {/* Main content card */}
            <div
              className="backdrop-blur-lg rounded-3xl p-8 shadow-2xl border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(213, 184, 147, 0.2)",
              }}
            >
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, #632024 0%, #6F4D38 100%)` }}
                >
                  <Music className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Discover Your Sound</h3>
                <p className="text-lg leading-relaxed" style={{ color: "#D5B893" }}>
                  Connect with millions of songs, create playlists, and share your musical taste with friends.
                </p>
              </div>
            </div>

            {/* Floating elements */}
            <div
              className="absolute -top-6 -right-6 w-12 h-12 rounded-full animate-bounce delay-300"
              style={{ backgroundColor: "#D5B893" }}
            ></div>
            <div
              className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full animate-bounce delay-700"
              style={{ backgroundColor: "#632024" }}
            ></div>
            <div
              className="absolute top-1/2 -right-8 w-6 h-6 rounded-full animate-bounce delay-1000"
              style={{ backgroundColor: "#6F4D38" }}
            ></div>
          </div>

          {/* Video background */}
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-10 rounded-3xl"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/Die_With_A_Smile.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  )
}

"use client";

import Link from "next/link"
import { Music } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const handleSpotifyLogin = () => {
    window.location.href = "http://localhost:8000/login"
  }

  return (
    <div className="flex min-h-screen bg-[#F0EEE5] text-foreground">
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-12">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8">
              <Music className="h-8 w-8 text-purple-600" />
            </div>
            <span className="text-xl font-semibold">MusicApp</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Welcome</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please sign with Spotify</p>
          </div>

          <Button variant="spotify" size="lg" className="w-full rounded-full" onClick={handleSpotifyLogin}>
            <img
              src="/spotify_logo.png"
              alt="Spotify Logo"
              className="mr-2 h-5 w-5"
            />
            Sign in with Spotify
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.spotify.com/us/signup&ved=2ahUKEwj24Pnb0tmLAxXehIkEHRYCBkYQFnoECAgQAQ&usg=AOvVaw0M0Bx5WvPsxcYC6xeJONKM" className="text-purple-600 hover:text-purple-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/Die_With_A_Smile.mp4" type="video/mp4" />
        </video>
      </div>
    </div>  
  )
}


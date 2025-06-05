"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="
        relative p-3 rounded-full 
        bg-card/80 backdrop-blur-sm
        border-2 border-border
        text-muted-foreground
        hover:bg-card hover:text-foreground
        hover:border-ring/50
        hover:scale-110 hover:shadow-lg
        transition-all duration-300 ease-in-out
        group
      "
      aria-label="Toggle theme"
    >
      {/* Sun Icon */}
      <Sun className="
        h-5 w-5 
        rotate-0 scale-100 transition-all duration-500 ease-in-out
        dark:-rotate-90 dark:scale-0
        group-hover:text-primary
      " />
      
      {/* Moon Icon */}
      <Moon className="
        absolute top-3 left-3 h-5 w-5 
        rotate-90 scale-0 transition-all duration-500 ease-in-out
        dark:rotate-0 dark:scale-100
        group-hover:text-primary
      " />
      
      {/* Glow effect */}
      <div className="
        absolute inset-0 rounded-full 
        bg-primary/20
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-300
        -z-10 blur-md
      " />
    </button>
  )
}
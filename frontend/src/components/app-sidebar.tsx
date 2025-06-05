"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, User, Music, Settings, Menu } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

// Navigation items similar to Instagram but for a music app
const navigationItems = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Top Tracks",
    url: "/dashboard/top_tracks",
    icon: Music,
  },
  {
    title: "Top Artists",
    url: "/dashboard/top_artists",
    icon: Music,
  },
  {
    title: "Top Genres",
    url: "/dashboard/top_genres",
    icon: Music,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
]

const bottomItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "More",
    url: "/more",
    icon: Menu,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props} className="bg-cream border-r border-sage/20 shadow-sm">
      <SidebarHeader className="p-6 border-b border-sage/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sage-light rounded-lg flex items-center justify-center shadow-sm">
            <Music className="w-5 h-5 text-cream" />
          </div>
          <h1 className="text-dark-green text-xl font-bold tracking-tight">Jammy</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 flex-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.url || (item.url === "/tracks" && pathname.includes("/tracks"))

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        relative h-12 px-4 rounded-xl transition-all duration-200 group w-full
                        ${
                          isActive
                            ? "bg-sage text-cream border border-sage/20 shadow-md"
                            : "text-sage hover:text-dark-green hover:bg-sage/10"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center w-full">
                        <div className="flex items-center space-x-4 w-full">
                          <item.icon
                            className={`w-6 h-6 flex-shrink-0 ${isActive ? "text-cream" : "text-sage group-hover:text-dark-green"}`}
                          />
                          <span
                            className={`font-medium ${isActive ? "text-cream font-semibold" : "text-sage group-hover:text-dark-green"}`}
                          >
                            {item.title}
                          </span>
                        </div>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sage/10">
        <SidebarMenu className="space-y-2">
          {bottomItems.map((item) => {
            const isActive = pathname === item.url

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={`
                    h-12 px-4 rounded-xl transition-all duration-200 group w-full
                    ${
                      isActive
                        ? "bg-sage text-cream border border-sage/20 shadow-md"
                        : "text-sage hover:text-dark-green hover:bg-sage/10"
                    }
                  `}
                >
                  <Link href={item.url} className="flex items-center w-full">
                    <div className="flex items-center space-x-4 w-full">
                      <item.icon
                        className={`w-6 h-6 flex-shrink-0 ${isActive ? "text-cream" : "text-sage group-hover:text-dark-green"}`}
                      />
                      <span
                        className={`font-medium ${isActive ? "text-cream font-semibold" : "text-sage group-hover:text-dark-green"}`}
                      >
                        {item.title}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

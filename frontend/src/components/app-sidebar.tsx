"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  User,
  Music,
  Heart,
  Settings,
  Menu,
} from "lucide-react"

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
    title: "Liked Songs",
    url: "/liked",
    icon: Heart,
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
    <Sidebar {...props} className="border-r border-slate-gray/20 bg-space-cadet/95 backdrop-blur-sm">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-tan to-coffee rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-space-cadet" />
          </div>
          <h1 className="text-tan text-xl font-bold tracking-tight">Jammy</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.url || (item.url === "/tracks" && pathname.includes("/tracks"))

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        relative h-12 px-4 rounded-xl transition-all duration-200 group
                        ${
                          isActive
                            ? "bg-tan/10 text-tan border border-tan/20 shadow-lg"
                            : "text-tan/70 hover:text-tan hover:bg-tan/5"
                        }
                      `}
                    >
                      <Link href={item.url}>
                        <div className="flex items-center space-x-4">
                          <item.icon
                            className={`w-6 h-6 ${isActive ? "text-tan" : "text-tan/70 group-hover:text-tan"}`}
                          />
                          <span
                            className={`font-medium ${isActive ? "text-tan font-semibold" : "text-tan/70 group-hover:text-tan"}`}
                          >
                            {item.title}
                          </span>
                        </div>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-tan rounded-r-full" />
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

      <SidebarFooter className="p-3">
        <SidebarMenu className="space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.url

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={`
                    h-12 px-4 rounded-xl transition-all duration-200 group
                    ${
                      isActive ? "bg-tan/10 text-tan border border-tan/20" : "text-tan/70 hover:text-tan hover:bg-tan/5"
                    }
                  `}
                >
                  <Link href={item.url}>
                    <div className="flex items-center space-x-4">
                      <item.icon className={`w-6 h-6 ${isActive ? "text-tan" : "text-tan/70 group-hover:text-tan"}`} />
                      <span
                        className={`font-medium ${isActive ? "text-tan font-semibold" : "text-tan/70 group-hover:text-tan"}`}
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

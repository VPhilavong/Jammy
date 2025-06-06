"use client"

import type * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, User, Music, Settings, LogOut } from "lucide-react"

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
]

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            const response = await fetch(`${backendUrl}/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })

            if (response.ok) {
                window.location.href = '/'
            } else {
                console.error('Logout failed')
            }
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <Sidebar {...props} className="bg-sidebar border-r border-sidebar-border shadow-sm">
            <SidebarHeader className="p-6 border-b border-sidebar-border">
                <div className="flex items-center space-x-3">
                    <h1 className="text-sidebar-foreground text-xl font-bold tracking-tight">Jammy</h1>
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
                                                        ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-md"
                                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                }
                      `}
                                        >
                                            <Link href={item.url} className="flex items-center w-full">
                                                <div className="flex items-center space-x-4 w-full">
                                                    <item.icon
                                                        className={`w-6 h-6 flex-shrink-0 ${
                                                            isActive
                                                                ? "text-sidebar-accent-foreground"
                                                                : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                                                        }`}
                                                    />
                                                    <span
                                                        className={`font-medium ${
                                                            isActive
                                                                ? "text-sidebar-accent-foreground font-semibold"
                                                                : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                                                        }`}
                                                    >
                                                        {item.title}
                                                    </span>
                                                </div>
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-ring rounded-r-full" />
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

            <SidebarFooter className="p-3 border-t border-sidebar-border">
                <SidebarMenu className="space-y-2">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="h-12 px-4 rounded-xl transition-all duration-200 group w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                        >
                            <div className="flex items-center space-x-4 w-full">
                                <LogOut className="w-6 h-6 flex-shrink-0 text-sidebar-foreground group-hover:text-sidebar-accent-foreground" />
                                <span className="font-medium text-sidebar-foreground group-hover:text-sidebar-accent-foreground">
                                    Logout
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight, Home, Settings, Database, Menu } from "lucide-react"

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      name: "Models",
      href: "/models",
      icon: Database,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <div
      className={cn(
        "h-screen bg-background border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 flex items-center justify-between border-b">
        {!collapsed && (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              M
            </div>
            <span className="ml-2 font-bold text-xl">Majin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn("ml-auto", collapsed && "mx-auto", "transition-transform")}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span
            className={cn(
              "transition-transform duration-300",
              collapsed ? "rotate-0" : "rotate-180"
            )}
          >
            <ChevronRight />
          </span>
          {!collapsed && <Menu className="ml-2" />}
        </Button>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center p-2 rounded-md hover:bg-accent transition-colors",
                  pathname === item.href && "bg-accent",
                  collapsed ? "justify-center" : "",
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        {!collapsed && <div className="text-xs text-muted-foreground">Majin v1.0.0</div>}
      </div>
    </div>
  )
}

/**
 * @file Sidebar.tsx
 * Main navigation sidebar for the admin dashboard.
 *
 * Renders a fixed left-side panel (desktop) or a slide-in drawer (mobile)
 * containing:
 *   - Brand header ("NIGHT VISION")
 *   - Event selector dropdown — switches the active event for all dashboard tabs
 *   - Navigation links to Applications, Analytics, Invitations, Events, Scanner
 *   - Logout button (calls POST /api/logout)
 *
 * Active route highlighting is handled by comparing `usePathname()` against
 * each menu item's `href`.
 *
 * The sidebar is always rendered inside `EventProvider` (set up in
 * `dashboard/layout.tsx`), so it can read and write `currentEvent` from context.
 *
 * Responsive behaviour:
 *   - md+ screens: sidebar is always visible (w-64, fixed left)
 *   - <md screens:  sidebar is hidden by default; a hamburger button (☰) in the
 *     top-left reveals it as an overlay drawer
 */
"use client"

import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Users, Ticket, LogOut, Menu, X, CalendarPlus, QrCode, Headphones, ClipboardList } from "lucide-react"
import { useState } from "react"
import { useEventContext } from "@/lib/EventContext"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { currentEvent, events, setCurrentEvent, isLoading: eventsLoading } = useEventContext()

  const menuItems = [
    {
      label: "Applications",
      href: "/dashboard",
      icon: ClipboardList,
      description: "Manage event applications"
    },
    {
      label: "DJs",
      href: "/dashboard/djs",
      icon: Headphones,
      description: "DJ roster & lineup"
    },
    {
      label: "Invitations",
      href: "/dashboard/invites",
      icon: Ticket,
      description: "Manage invitation codes"
    },
    {
      label: "Events",
      href: "/dashboard/events",
      icon: CalendarPlus,
      description: "Create & manage events"
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      description: "View event statistics"
    },
    {
      label: "Scanner",
      href: "/dashboard/scanner",
      icon: QrCode,
      description: "QR code door scanner"
    }
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      })

      if (res.ok) {
        router.push("/admin")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-50 md:hidden p-2 hover:bg-neutral-800 rounded-lg transition-all duration-300"
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Menu size={24} className="text-white" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-black border-r border-neutral-800 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-neutral-800">
          <div className="space-y-2">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              NIGHT VISION
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          {/* Event Selector */}
          {!eventsLoading && events.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-600 font-light mb-2">
                Current Event
              </p>
              <select
                value={currentEvent?.id || ""}
                onChange={(e) => {
                  const selected = events.find((ev) => ev.id === e.target.value)
                  if (selected) setCurrentEvent(selected)
                }}
                className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-white text-[11px] tracking-[0.1em] focus:outline-none focus:border-neutral-600 transition-all duration-300 rounded"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id} className="bg-black">
                    {event.name}
                  </option>
                ))}
              </select>
              {currentEvent && (
                <p className="text-[10px] tracking-[0.15em] text-neutral-600 font-light mt-1">
                  {currentEvent.date ? new Date(currentEvent.date.slice(0, 10) + "T12:00:00").toLocaleDateString() : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setIsOpen(false)
                }}
                className={`w-full group relative flex items-start gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                  active
                    ? "bg-neutral-900 border border-neutral-700"
                    : "hover:bg-neutral-900 border border-transparent"
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}

                <Icon
                  size={20}
                  className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                    active
                      ? "text-white"
                      : "text-neutral-500 group-hover:text-white"
                  }`}
                />

                <div className="flex flex-col items-start">
                  <span
                    className={`text-sm font-light tracking-[0.15em] uppercase transition-all duration-300 ${
                      active ? "text-white" : "text-neutral-400 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-neutral-600 font-light mt-1 whitespace-nowrap">
                    {item.description}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-6 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="w-full group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-900 transition-all duration-300 border border-transparent hover:border-red-400/30"
          >
            <LogOut
              size={18}
              className="text-neutral-500 group-hover:text-red-400 transition-all duration-300"
            />
            <span className="text-sm font-light tracking-[0.15em] uppercase text-neutral-400 group-hover:text-red-400 transition-all duration-300">
              Logout
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            © 2026
          </p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main content spacer */}
      <div className="hidden md:block w-64" />
    </>
  )
}
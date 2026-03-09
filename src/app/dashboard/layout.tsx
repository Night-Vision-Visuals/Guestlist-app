import { verifyAdminSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/app/components/Sidebar"
import { EventProvider } from "@/lib/EventContext"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication check
  const admin = await verifyAdminSession()

  // If no valid session, redirect to admin login
  if (!admin) {
    redirect("/admin")
  }

  // Admin is authenticated, render with sidebar inside shared event context
  return (
    <EventProvider>
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <main className="flex-1 w-full md:w-auto">
          {children}
        </main>
      </div>
    </EventProvider>
  )
}
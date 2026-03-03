import { verifyAdminSession } from "@/lib/auth"
import { redirect } from "next/navigation"

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

  // Admin is authenticated, render the dashboard
  return <>{children}</>
}
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { MusicProvider } from "@/app/components/MusicProvider"
import { MusicToggle } from "@/app/components/MusicToggle"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Night Vision",
  description: "Let´s bring Vision into the Night",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <MusicProvider>
          {children}
          <MusicToggle />
        </MusicProvider>
      </body>
    </html>
  )
}
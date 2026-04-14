import type { Metadata } from "next"
import { Press_Start_2P, DM_Mono } from "next/font/google"
import "./globals.css"
import { MusicProvider } from "@/app/components/MusicProvider"
import { MusicToggle } from "@/app/components/MusicToggle"

// Arcade pixel font — all h1 headings, all caps + glow
const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-arcade",
  subsets: ["latin"],
  display: "swap",
})

// Body font — DM Mono (clean monospace, Punto-adjacent)
const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
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
        className={`${pressStart2P.variable} ${dmMono.variable} antialiased bg-black text-white`}
      >
        <MusicProvider>
          {children}
          <MusicToggle />
        </MusicProvider>
      </body>
    </html>
  )
}

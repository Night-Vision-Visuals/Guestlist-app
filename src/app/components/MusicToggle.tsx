/**
 * @file MusicToggle.tsx
 * Floating mute/unmute button rendered in the bottom-right corner of every page.
 *
 * Positioned fixed so it persists across client-side navigation. It reads from
 * and writes to the `MusicProvider` context, so toggling it from any page
 * affects the single shared audio instance.
 *
 * Icons: Volume2 (playing) / VolumeX (muted) from lucide-react.
 */
"use client"

import { useMusic } from "@/app/components/MusicProvider"
import { Volume2, VolumeX } from "lucide-react"
import { useState } from "react"

export function MusicToggle() {
  const { isPlaying, toggleMusic } = useMusic()
  const [showDebug, setShowDebug] = useState(false)

  return (
    <>
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 right-6 z-40 group p-3 rounded-full border border-neutral-800 hover:border-orange-400 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:bg-black/80"
        title={isPlaying ? "Mute" : "Unmute"}
      >
        {isPlaying ? (
          <Volume2 size={20} className="text-orange-400 group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <VolumeX size={20} className="text-neutral-500 group-hover:text-white transition-colors duration-300" />
        )}
      </button>

      {/* Debug info button (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="fixed bottom-6 left-6 z-40 text-[10px] text-neutral-600 hover:text-white transition-colors"
        >
          Debug: {isPlaying ? "Playing" : "Stopped"}
        </button>
      )}
    </>
  )
}
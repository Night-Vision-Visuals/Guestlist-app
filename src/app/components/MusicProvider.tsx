/**
 * @file MusicProvider.tsx
 * Global ambient audio context for the Night Vision app.
 *
 * Wraps the root layout (`src/app/layout.tsx`) and provides a shared audio
 * player so all pages can share the same playback state. Autoplay is blocked
 * by most browsers until the first user gesture, so music only starts when the
 * user explicitly taps the `MusicToggle` button.
 *
 * Context value:
 *   isPlaying  — whether audio is currently playing
 *   toggleMusic — start/stop playback
 *
 * The audio source is expected at `/public/music.mp3` (or whichever file is
 * referenced in the `<audio>` element inside this component).
 *
 * Consumers: import `useMusic()` to access `{ isPlaying, toggleMusic }`.
 */
"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface MusicContextType {
  isPlaying: boolean
  toggleMusic: () => void
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element with autoplay
    const audioElement = new Audio()
    audioElement.loop = true
    audioElement.volume = 0.3
    
    // Use the correct path - case-sensitive on Linux/Vercel
    const audioPath = "/Music/background.mp3"
    
    audioElement.src = audioPath
    
    console.log("Loading audio from:", audioPath)
    
    // Handle audio errors
    audioElement.onerror = (error) => {
      console.error("Audio loading error:", error, "from path:", audioPath)
    }
    
    audioElement.onloadstart = () => {
      console.log("Audio loading started")
    }
    
    audioElement.oncanplay = () => {
      console.log("Audio can play")
      audioElement.play().catch((err) => {
        console.log("Autoplay blocked or failed:", err)
        // Fallback: start playing on user interaction
        const handleInteraction = () => {
          audioElement.play().catch(e => console.log("Play after interaction failed:", e))
          document.removeEventListener("click", handleInteraction)
          document.removeEventListener("touchstart", handleInteraction)
        }
        document.addEventListener("click", handleInteraction)
        document.addEventListener("touchstart", handleInteraction)
      })
    }
    
    setAudio(audioElement)

    return () => {
      audioElement.pause()
      audioElement.currentTime = 0
      audioElement.src = ""
    }
  }, [])

  useEffect(() => {
    if (!audio) return

    if (isPlaying) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Music playing")
            setIsPlaying(true)
          })
          .catch((err) => {
            console.log("Play failed:", err)
          })
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, audio])

  const toggleMusic = () => {
    if (!audio) return

    if (audio.paused) {
      audio.play().catch(err => console.log("Toggle play failed:", err))
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  return (
    <MusicContext.Provider value={{ isPlaying, toggleMusic }}>
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (context === undefined) {
    throw new Error("useMusic must be used within MusicProvider")
  }
  return context
}
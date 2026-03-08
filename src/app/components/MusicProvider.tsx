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
    const audioElement = new Audio("/music/background.mp3")
    audioElement.loop = true
    audioElement.volume = 0.3
    audioElement.autoplay = true
    audioElement.muted = false // Enable sound from start
    
    setAudio(audioElement)
    setIsPlaying(true)

    return () => {
      audioElement.pause()
      audioElement.currentTime = 0
    }
  }, [])

  useEffect(() => {
    if (!audio) return

    if (isPlaying) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log("Autoplay blocked:", err)
          // Fallback: start playing on user interaction
          const handleInteraction = () => {
            audio.play()
            document.removeEventListener("click", handleInteraction)
          }
          document.addEventListener("click", handleInteraction)
        })
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, audio])

  const toggleMusic = () => {
    if (!audio) return

    if (audio.paused) {
      audio.play()
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
"use client"

import { useMusic } from "@/app/components/MusicProvider"
import { Volume2, VolumeX } from "lucide-react"

export function MusicToggle() {
  const { isPlaying, toggleMusic } = useMusic()

  return (
    <button
      onClick={toggleMusic}
      className="fixed bottom-6 right-6 z-40 group p-3 rounded-full border border-neutral-800 hover:border-emerald-400 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:bg-black/80"
      title={isPlaying ? "Mute" : "Unmute"}
    >
      {isPlaying ? (
        <div className="flex items-center justify-center">
          <Volume2 size={20} className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
          <span className="absolute text-[10px] text-emerald-400 font-light -bottom-6 whitespace-nowrap">
            Playing
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <VolumeX size={20} className="text-neutral-500 group-hover:text-white transition-colors duration-300" />
          <span className="absolute text-[10px] text-neutral-400 font-light -bottom-6 whitespace-nowrap">
            Click to play
          </span>
        </div>
      )}
    </button>
  )
}
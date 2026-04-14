"use client"

import Link from "next/link"
import { ArrowRight, Music, Zap, Users } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef } from "react"

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Particle system
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      alpha: number
    }> = []

    // Create initial particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.5,
        alpha: Math.random() * 0.5,
      })
    }

    // Grid lines
    const gridSize = 50
    let time = 0

    const animate = () => {
      time++

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "rgba(16, 185, 129, 0.05)"
      ctx.lineWidth = 1

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Update and draw particles
      particles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.alpha += (Math.random() - 0.5) * 0.02

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))

        // Clamp alpha
        particle.alpha = Math.max(0.1, Math.min(0.5, particle.alpha))

        // Draw particle
        ctx.fillStyle = `rgba(16, 185, 129, ${particle.alpha})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw connecting lines
      ctx.strokeStyle = "rgba(16, 185, 129, 0.1)"
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.globalAlpha = (1 - distance / 100) * 0.3
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ background: "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(10,10,20,0.9) 100%)" }}
      />
      {/* 🎥 Background Video */}
        <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed w-full h-full overflow-hidden object-cover"
      >
        <source src="/video/bg.mp4" type="video/mp4" />
      </video>
      {/* 🌑 Dark overlay for readability */}
      <div className="fixed inset-0 bg-black/88" />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 md:px-16 py-8 border-b border-neutral-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Night Vision"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>

          <div className="flex items-center gap-6 ">
            <a
              href="https://instagram.com/nightvision_raw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors duration-300"
            >
              Follow
            </a>
            <Link
              href="/admin"
              className="text-xs tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors duration-300"
            >
              Login
            </Link>
          </div>
        </nav>



        {/* Hero Section */}
        <div className="min-h-screen flex flex-col justify-center items-center px-6 md:px-16 py-20 text-center">
          {/* Main Heading */}
          <div className="space-y-6 mb-12">
            <Image
              src="/logo.png"
              alt="Night Vision"
              width={500}
              height={500}
              className="h-100 w-100 object-contain mx-auto mb-6"
            />
            <p className="text-neutral-400 text-lg tracking-[0.2em] uppercase font-light max-w-2xl mx-auto">
              Curated Events. Seamless Experience. Exclusive Access.
            </p>
          </div>

          {/* Divider */}
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent mb-12" />

          

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-6 mb-20">
            <Link
              href="/login"
              className="group relative px-8 md:px-12 py-4 bg-neutral-600 hover:bg-neutral-500 text-white font-light tracking-[0.2em] uppercase text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-3"
            >
              Access Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="https://instagram.com/nightvision_raw"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-8 md:px-12 py-4 border-2 border-neutral-400 text-neutral-400 font-light tracking-[0.2em] uppercase text-sm rounded-lg hover:bg-neutral-400 hover:text-black transition-all duration-300"
            >
              Follow Us
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <div className="group border border-neutral-800 p-8 rounded-lg hover:border-neutral-400/50 hover:bg-neutral-400/5 transition-all duration-300 backdrop-blur-sm">
              <Users size={24} className="text-neutral-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-2">
                Curated
              </h3>
              <p className="text-neutral-500 text-sm font-light">
                Handpicked guests and exclusive invitations
              </p>
            </div>

            <div className="group border border-neutral-800 p-8 rounded-lg hover:border-neutral-400/50 hover:bg-neutral-400/5 transition-all duration-300 backdrop-blur-sm">
              <Zap size={24} className="text-neutral-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-2">
                Fast
              </h3>
              <p className="text-neutral-500 text-sm font-light">
                Real-time application tracking and instant approvals
              </p>
            </div>

            <div className="group border border-neutral-800 p-8 rounded-lg hover:border-neutral-400/50 hover:bg-neutral-400/5 transition-all duration-300 backdrop-blur-sm">
              <Music size={24} className="text-neutral-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-2">
                Experience
              </h3>
              <p className="text-neutral-500 text-sm font-light">
                Immersive events designed for unforgettable nights
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t border-neutral-800/50 px-6 md:px-16 py-12 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* About */}
            <div>
              <h4 className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light mb-4">
                About
              </h4>
              <p className="text-neutral-600 text-sm font-light leading-relaxed">
                Night Vision brings together the most exclusive events with seamless management and curation.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light mb-4">
                Quick Links
              </h4>
              <div className="space-y-2">
                <Link
                  href="/apply"
                  className="block text-neutral-600 hover:text-white text-sm font-light transition-colors duration-300"
                >
                  Apply
                </Link>
                <Link
                  href="/admin"
                  className="block text-neutral-600 hover:text-white text-sm font-light transition-colors duration-300"
                >
                  Admin
                </Link>
                <a
                  href="https://instagram.com/nightvision_raw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-neutral-600 hover:text-white text-sm font-light transition-colors duration-300"
                >
                  Instagram
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light mb-4">
                Connect
              </h4>
              <a
                href="https://instagram.com/nightvision_raw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-400 text-sm font-light transition-colors duration-300"
              >
                @nightvision_raw
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-neutral-800/50 mt-12 pt-8 text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
              © 2026 Night Vision. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
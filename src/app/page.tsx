import Link from "next/link"
import { ArrowRight, Music, Zap, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl opacity-10 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 md:px-16 py-8 border-b border-neutral-800/50">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              NIGHT VISION
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>

          <div className="flex items-center gap-6">
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
            <h1 className="text-7xl md:text-9xl font-light tracking-tight leading-none">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent block mb-4">
                NIGHT
              </span>
              <span className="bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-600 bg-clip-text text-transparent block">
                VISION
              </span>
            </h1>
            <p className="text-neutral-400 text-lg tracking-[0.2em] uppercase font-light max-w-2xl mx-auto">
              Curated Events. Seamless Experience. Exclusive Access.
            </p>
          </div>

          {/* Divider */}
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-white to-transparent mb-12" />

          {/* Description */}
          <p className="text-neutral-300 text-base md:text-lg font-light max-w-3xl mx-auto mb-16 leading-relaxed">
            Welcome to the most exclusive event management platform. Apply to curated experiences, 
            track your status in real-time, and gain access to unforgettable nights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-6 mb-20">
            <Link
              href="/login"
              className="group relative px-8 md:px-12 py-4 bg-white text-black font-light tracking-[0.2em] uppercase text-sm rounded-lg hover:bg-emerald-400 transition-all duration-300 flex items-center justify-center gap-3"
            >
              Access Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="https://instagram.com/nightvision_raw"
              className="group relative px-8 md:px-12 py-4 border-2 border-white text-white font-light tracking-[0.2em] uppercase text-sm rounded-lg hover:border-emerald-400 hover:text-emerald-400 transition-all duration-300"
            >
              Follow Us
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <div className="group border border-neutral-800 p-8 rounded-lg hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all duration-300">
              <Users size={24} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-2">
                Curated
              </h3>
              <p className="text-neutral-500 text-sm font-light">
                Handpicked guests and exclusive invitations
              </p>
            </div>

            <div className="group border border-neutral-800 p-8 rounded-lg hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all duration-300">
              <Zap size={24} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-2">
                Fast
              </h3>
              <p className="text-neutral-500 text-sm font-light">
                Real-time application tracking and instant approvals
              </p>
            </div>

            <div className="group border border-neutral-800 p-8 rounded-lg hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all duration-300">
              <Music size={24} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
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
        <div className="border-t border-neutral-800/50 px-6 md:px-16 py-12">
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
                  href="/login"
                  className="block text-neutral-600 hover:text-white text-sm font-light transition-colors duration-300"
                >
                  Access
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
                className="text-neutral-600 hover:text-emerald-400 text-sm font-light transition-colors duration-300 flex items-center gap-2"
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
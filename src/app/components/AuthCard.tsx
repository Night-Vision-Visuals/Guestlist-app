/**
 * @file AuthCard.tsx
 * Minimal card wrapper used by auth-style forms (login, access code entry).
 *
 * Renders a dark-bordered box with a title and optional subtitle, sized to
 * hold form content. Props:
 *   title    — heading displayed at the top of the card
 *   subtitle — smaller description line beneath the title (optional)
 *   children — form elements or other content
 */
"use client"

export default function AuthCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 p-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-neutral-400 text-sm">{subtitle}</p>
        )}
      </div>

      {children}
    </div>
  )
}
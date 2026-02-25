"use client"

import { InputHTMLAttributes } from "react"

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, ...props }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm uppercase tracking-widest text-neutral-400">
        {label}
      </label>
      <input
        {...props}
        className="bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:border-white transition-all duration-300"
      />
    </div>
  )
}
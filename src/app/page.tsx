"use client"

import { useState } from "react"

export default function Home() {
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const res = await fetch("/api/validate-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()

    if (data.success) {
      setMessage("Access granted. Registration opens soon.")
    } else {
      setMessage("Invalid invite code.")
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter invite code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="p-2 text-black"
        />
        <button className="bg-white text-black p-2">
          Enter
        </button>
        <p>{message}</p>
      </form>
    </div>
  )
}
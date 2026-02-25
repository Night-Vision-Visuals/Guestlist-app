"use client"

import { useState } from "react"

export default function Home() {
  const [code, setCode] = useState("")
  const [accessGranted, setAccessGranted] = useState(false)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    age_confirmed: false,
    intro: ""
  })

  const validateCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (data.success) {
        setAccessGranted(true)
        setMessage("")
        setCode("")
      } else {
        setMessage("Invalid invite code.")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const submitApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.full_name.trim() || !formData.email.trim()) {
      setMessage("Please fill in all required fields.")
      return
    }

    if (!formData.age_confirmed) {
      setMessage("You must confirm you are 18+")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        setMessage("Application submitted successfully.")
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          age_confirmed: false,
          intro: ""
        })
      } else {
        setMessage("Submission failed. Please try again.")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white p-6">
      {!accessGranted ? (
        <form onSubmit={validateCode} className="flex flex-col gap-4 w-80">
          <h1 className="text-2xl font-bold mb-4">Enter Invite Code</h1>
          <input
            type="text"
            placeholder="Enter invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="p-2 text-black rounded"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-white text-black p-2 rounded font-semibold hover:bg-gray-200 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Enter"}
          </button>
          {message && <p className="text-red-400">{message}</p>}
        </form>
      ) : (
        <form onSubmit={submitApplication} className="flex flex-col gap-4 w-80">
          <h1 className="text-2xl font-bold mb-4">Application Form</h1>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            required
            className="p-2 text-black rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            className="p-2 text-black rounded"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="p-2 text-black rounded"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.age_confirmed}
              onChange={(e) =>
                setFormData({ ...formData, age_confirmed: e.target.checked })
              }
              required
            />
            <span>I confirm I am 18+</span>
          </label>
          <textarea
            placeholder="Short intro (optional)"
            value={formData.intro}
            onChange={(e) =>
              setFormData({ ...formData, intro: e.target.value })
            }
            className="p-2 text-black rounded"
            rows={4}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-white text-black p-2 rounded font-semibold hover:bg-gray-200 disabled:opacity-50"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
          {message && (
            <p className={message.includes("success") ? "text-green-400" : "text-red-400"}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
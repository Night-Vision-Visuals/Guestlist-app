"use client"

import { useEffect, useState } from "react"

export default function AdminPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [secret, setSecret] = useState("")
  const [authenticated, setAuthenticated] = useState(false)

  const login = () => {
    if (secret === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      setAuthenticated(true)
    } else {
      alert("Wrong password")
    }
  }

  useEffect(() => {
    if (authenticated) {
      fetchApplications()
    }
  }, [authenticated])

  const fetchApplications = async () => {
    const res = await fetch("/api/admin/applications")
    const data = await res.json()
    setApplications(data)
  }

  const updateStatus = async (id: string, action: string) => {
    await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    })

    fetchApplications()
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Admin password"
            onChange={(e) => setSecret(e.target.value)}
            className="p-2 text-black"
          />
          <button onClick={login} className="bg-white text-black p-2">
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-6">Applications</h1>
      {applications.map((app) => (
        <div key={app.id} className="border p-4 mb-4">
          <p><strong>Name:</strong> {app.full_name}</p>
          <p><strong>Email:</strong> {app.email}</p>
          <p><strong>Status:</strong> {app.status}</p>

          {app.status === "applied" && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => updateStatus(app.id, "approve")}
                className="bg-green-600 px-3 py-1"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(app.id, "reject")}
                className="bg-red-600 px-3 py-1"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
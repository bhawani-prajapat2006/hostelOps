"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, CheckCircle2, AlertCircle, BookOpen, Wrench, Building2 } from "lucide-react"
import api from "@/lib/api"
import { getAccessToken } from "@/lib/tokenStore"

export default function SelectRolePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState("student")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      if (!token) {
        router.push("/login")
        return
      }

      const meRes = await api.get("/api/v1/auth/me")

      const userData = meRes.data

      // If role is already set (not student), redirect
      if (userData.role !== "student" || userData.status !== "active") {
        router.replace("/dashboard")
        return
      }

      setUser(userData)
      setSelectedRole("student")
    } catch (err) {
      console.error("Failed to fetch user data:", err)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRole = async (role) => {
    setSelectedRole(role)
  }

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      setError("")

      await api.post(
        "/api/v1/auth/select-role",
        { role: selectedRole }
      )

      // Redirect based on selected role
      if (selectedRole === "worker" || selectedRole === "warden") {
        router.replace("/auth/pending-approval")
      } else {
        router.replace("/dashboard")
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to select role. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-bars loading-lg text-primary"></span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <p className="text-base-content/60">Failed to load. Please try again.</p>
      </div>
    )
  }

  const roleOptions = [
    {
      value: "student",
      title: "Student",
      description: "Post and track your hostel complaints",
      Icon: BookOpen,
      benefits: [
        "Post complaints immediately",
        "Track complaint status",
        "View resolution history"
      ],
      approval: false
    },
    {
      value: "worker",
      title: "Maintenance Worker",
      description: "Handle and resolve hostel maintenance tasks",
      Icon: Wrench,
      benefits: [
        "View assigned tasks",
        "Update task resolution status",
        "Track performance metrics"
      ],
      approval: true
    },
    {
      value: "warden",
      title: "Hostel Warden",
      description: "Manage complaints and assign workers",
      Icon: Building2,
      benefits: [
        "Manage all hostel complaints",
        "Assign workers to tasks",
        "Update complaint statuses",
        "Overview of maintenance progress"
      ],
      approval: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center">
          <Zap className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Welcome, {user.username}!</h1>
        <p className="text-base-content/60 max-w-2xl mx-auto">
          Your Google account has been linked to HostelOps. Please select your role to get started.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {roleOptions.map((option) => (
          <div
            key={option.value}
            className={`card cursor-pointer transition-all border-2 ${
              selectedRole === option.value
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-base-300 bg-base-100 hover:border-primary/50"
            }`}
            onClick={() => handleSelectRole(option.value)}
          >
            <div className="card-body">
              {/* Icon & Title */}
              <div className="mb-3 flex justify-center">
                <option.Icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="card-title text-lg justify-center">{option.title}</h3>
              <p className="text-sm text-base-content/60 text-center">{option.description}</p>

              {/* Benefits List */}
              <ul className="space-y-2 my-4">
                {option.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Approval Badge */}
              {option.approval && (
                <div className="alert alert-info gap-2 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">Requires admin approval</span>
                </div>
              )}

              {/* Selection Indicator */}
              {selectedRole === option.value && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <div className="badge badge-primary w-full justify-center">
                    Selected
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center max-w-md mx-auto">
        <button
          onClick={() => router.push("/login")}
          className="btn btn-ghost flex-1"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="btn btn-primary flex-1 gap-2"
        >
          {submitting ? (
            <>
              <span className="loading loading-bars loading-sm"></span>
              Confirming...
            </>
          ) : (
            <>
              Continue as {roleOptions.find(r => r.value === selectedRole)?.title}
            </>
          )}
        </button>
      </div>

    </div>
  )
}


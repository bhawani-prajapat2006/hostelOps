"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, AlertCircle, LogOut, RefreshCw } from "lucide-react"
import api from "@/lib/api"

export default function PendingApprovalPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/login")
        return
      }

      const meRes = await api.get("/api/v1/auth/me")

      const userData = meRes.data

      // If status is active, redirect to dashboard
      if (userData.status === "active") {
        if (userData.role === "worker") {
          router.replace("/dashboard/worker")
        } else if (userData.role === "warden") {
          router.replace("/dashboard/warden")
        } else {
          router.replace("/dashboard")
        }
        return
      }

      // If not pending, something went wrong
      if (userData.status !== "pending") {
        router.replace("/dashboard")
        return
      }

      setUser(userData)
    } catch (err) {
      console.error("Failed to fetch user data:", err)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setCheckingStatus(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    await fetchUserData()
    setCheckingStatus(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
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

  const roleInfo = {
    worker: {
      title: "Worker Account Pending",
      description: "Your worker account is awaiting admin approval.",
      icon: "🔧",
      what_next: "An admin will review your application and grant you access to the worker dashboard where you can:",
      features: [
        "View assigned maintenance tasks",
        "Update task status",
        "Track your performance metrics"
      ]
    },
    warden: {
      title: "Warden Account Pending",
      description: "Your warden account is awaiting admin approval.",
      icon: "🏠",
      what_next: "An admin will review your application and grant you access to the warden dashboard where you can:",
      features: [
        "Manage all complaints in your hostel",
        "Assign workers to tasks",
        "Update complaint statuses"
      ]
    }
  }

  const info = roleInfo[user.role] || roleInfo.worker

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center p-6">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body space-y-6">

          {/* Header with Icon */}
          <div className="text-center">
            <div className="text-6xl mb-3">{info.icon}</div>
            <h1 className="text-2xl font-bold">{info.title}</h1>
            <p className="text-base-content/60 mt-2">{info.description}</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <Clock className="w-5 h-5 text-warning flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Pending Review</p>
              <p className="text-xs text-base-content/60 mt-1">Status: {user.status.toUpperCase()}</p>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-2 bg-base-200 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-base-content/60">Name:</span>
              <span className="font-semibold">{user.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-base-content/60">Email:</span>
              <span className="font-semibold text-sm">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-base-content/60">Role:</span>
              <span className="badge badge-primary">{user.role.toUpperCase()}</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="space-y-3">
            <p className="font-semibold text-sm">{info.what_next}</p>
            <ul className="space-y-2">
              {info.features.map((feature, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="text-primary flex-shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Alert */}
          <div className="alert alert-info gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Typical approval time</p>
              <p className="text-xs text-base-content/80">Your application will be reviewed within 24 hours. You'll automatically get access once approved!</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-base-300">
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="btn btn-primary btn-sm w-full gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
              {checkingStatus ? 'Checking...' : 'Check Status'}
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

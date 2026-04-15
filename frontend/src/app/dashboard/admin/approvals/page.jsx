"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  RefreshCw,
  ChevronLeft,
  AlertCircle,
  Users
} from "lucide-react"
import api from "@/lib/api"

export default function AdminApprovalPanel() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Verify user is admin
      const userRes = await api.get("/api/v1/auth/me")
      const userData = userRes.data

      if (userData.role !== "admin") {
        router.replace("/dashboard")
        return
      }

      setUser(userData)

      // Fetch pending users
      try {
        const pendingRes = await api.get("/api/v1/auth/pending-users")
        setPendingUsers(Array.isArray(pendingRes.data) ? pendingRes.data : [])
      } catch (err) {
        console.error("Failed to fetch pending users:", err)
        setPendingUsers([])
      }

    } catch (err) {
      console.error("Failed to verify admin access:", err)
      router.replace("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      setApproving(userId)
      await api.post(`/api/v1/auth/approve-user/${userId}`)
      await fetchData()
    } catch (err) {
      console.error("Failed to approve user:", err)
      alert("Failed to approve user. Please try again.")
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (userId) => {
    try {
      setRejectingId(userId)
      await api.post(`/api/v1/auth/reject-user/${userId}`)
      await fetchData()
    } catch (err) {
      console.error("Failed to reject user:", err)
      alert("Failed to reject user. Please try again.")
    } finally {
      setRejectingId(null)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin">
          <button className="btn btn-ghost btn-circle">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            User Approvals
          </h1>
          <p className="text-base-content/60 mt-1">Review and approve pending user applications</p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-base-content/60 uppercase tracking-wider">
                Pending Approvals
              </p>
              <p className="text-4xl font-bold mt-1">{pendingUsers.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-base-200">
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Approval List */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body bg-gradient-to-r from-primary to-secondary/40 text-primary-content pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6" />
            <h2 className="card-title text-2xl font-extrabold">
              Pending User Applications
            </h2>
          </div>
        </div>

        <div className="divider m-0"></div>

        {pendingUsers.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-success mb-3 opacity-50" />
            <p className="text-lg font-semibold">All caught up!</p>
            <p className="text-base-content/60 mt-2">
              No pending user applications at the moment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="border-base-300">
                  <th className="text-sm font-bold">User Info</th>
                  <th className="text-sm font-bold">Role</th>
                  <th className="text-sm font-bold">Applied</th>
                  <th className="text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pendingUser) => (
                  <tr key={pendingUser.id} className="hover:bg-base-100 border-base-200">
                    {/* User Info */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 rounded-full bg-primary/20">
                            <img
                              src={`https://ui-avatars.com/api/?name=${pendingUser.username}&background=0D8ABC&color=fff`}
                              alt={pendingUser.username}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-sm">{pendingUser.username}</p>
                          <p className="text-xs text-base-content/60 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {pendingUser.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <div className={`badge ${
                        pendingUser.role === "worker" ? "badge-secondary" : "badge-info"
                      } uppercase font-bold`}>
                        {pendingUser.role}
                      </div>
                    </td>

                    {/* Applied Date */}
                    <td>
                      <div className="text-sm">
                        {new Date(pendingUser.created_at).toLocaleDateString()}
                        <p className="text-xs text-base-content/60">
                          {new Date(pendingUser.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(pendingUser.id)}
                          disabled={approving === pendingUser.id || rejectingId !== null}
                          className="btn btn-success btn-sm gap-2"
                        >
                          {approving === pendingUser.id ? (
                            <span className="loading loading-bars loading-xs"></span>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(pendingUser.id)}
                          disabled={rejectingId === pendingUser.id || approving !== null}
                          className="btn btn-error btn-sm gap-2"
                        >
                          {rejectingId === pendingUser.id ? (
                            <span className="loading loading-bars loading-xs"></span>
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="alert alert-info gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-bold text-sm">How approvals work:</p>
          <ul className="text-sm mt-2 space-y-1 ml-4 list-disc">
            <li>Workers and Wardens need admin approval to use the system</li>
            <li>Approved users will automatically get full access to their dashboard</li>
            <li>Rejected users will keep their student role instead</li>
          </ul>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchData}
          className="btn btn-outline gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh List
        </button>
      </div>

    </div>
  )
}


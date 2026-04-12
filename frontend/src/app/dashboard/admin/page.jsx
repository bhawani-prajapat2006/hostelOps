"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Settings,
  BarChart3,
  User,
  ChevronRight,
  RefreshCw,
  Target,
  Zap,
  Activity,
  Trash2,
  Clock
} from "lucide-react"

import api from "@/lib/api"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [allComplaints, setAllComplaints] = useState([])
  const [displayComplaints, setDisplayComplaints] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    totalComplaints: 0,
    totalUsers: 0,
    resolvedToday: 0,
    activeWorkers: 0,
    openComplaints: 0,
    inProgressComplaints: 0,
    closedComplaints: 0,
  })
  const [categoryStats, setCategoryStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [complaintFilter, setComplaintFilter] = useState("all")
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch current user
      const userRes = await api.get("/api/v1/auth/me")
      const userData = userRes.data

      // Redirect if not admin
      if (userData.role !== "admin") {
        router.replace("/dashboard")
        return
      }

      // Redirect if not active (future-proofing)
      if (userData.status !== "active") {
        router.replace("/auth/pending-approval")
        return
      }

      setUser(userData)

      // Fetch all complaints (max 100 per page)
      const complaintsRes = await api.get("/api/v1/complaints?page_size=100")
      const allComplaints = Array.isArray(complaintsRes.data?.complaints)
        ? complaintsRes.data.complaints
        : Array.isArray(complaintsRes.data)
        ? complaintsRes.data
        : []

      setAllComplaints(allComplaints)
      filterComplaints(allComplaints, "all")

      // Fetch all users
      const usersRes = await api.get("/api/v1/users?page_size=100")
      const allUsers = Array.isArray(usersRes.data?.users)
        ? usersRes.data.users
        : []
      setUsers(allUsers)

      // Calculate statistics
      const openCount = allComplaints.filter(c => c.status === "open").length
      const inProgressCount = allComplaints.filter(c => c.status === "in_progress").length
      const closedCount = allComplaints.filter(c => c.status === "closed").length

      // Calculate category stats
      const catStats = {}
      allComplaints.forEach(c => {
        catStats[c.category] = (catStats[c.category] || 0) + 1
      })

      // Count active workers (workers with assigned tasks)
      const workersWithTasks = new Set(
        allComplaints
          .filter(c => c.assigned_to)
          .map(c => c.assigned_to)
      ).size

      const today = new Date().toDateString()
      const resolvedToday = allComplaints.filter(
        c => c.status === "closed" && new Date(c.updated_at).toDateString() === today
      ).length

      setStats({
        totalComplaints: allComplaints.length,
        totalUsers: allUsers.length,
        resolvedToday,
        activeWorkers: workersWithTasks,
        openComplaints: openCount,
        inProgressComplaints: inProgressCount,
        closedComplaints: closedCount,
      })

      setCategoryStats(catStats)

    } catch (err) {
      console.error("Failed to load admin dashboard", err)
      showNotification("Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  const filterComplaints = (complaints, filter) => {
    let filtered = complaints
    if (filter !== "all") {
      filtered = complaints.filter(c => c.status === filter)
    }
    // Sort by newest first
    filtered = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setDisplayComplaints(filtered)
  }

  const handleFilterChange = (filter) => {
    setComplaintFilter(filter)
    filterComplaints(allComplaints, filter)
  }

  const handleMarkResolved = async (id) => {
    try {
      await api.put(`/api/v1/complaints/${id}`, { status: "closed" })
      showNotification("Complaint marked as resolved", "success")
      const updated = allComplaints.map(c => c.id === id ? { ...c, status: "closed" } : c)
      setAllComplaints(updated)
      filterComplaints(updated, complaintFilter)
    } catch (err) {
      showNotification("Failed to update complaint", "error")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return

    try {
      await api.delete(`/api/v1/complaints/${id}`)
      showNotification("Complaint deleted", "success")
      const updated = allComplaints.filter(c => c.id !== id)
      setAllComplaints(updated)
      filterComplaints(updated, complaintFilter)
    } catch (err) {
      showNotification("Failed to delete complaint", "error")
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000)
  }

  const resolutionRate = stats.totalComplaints > 0
    ? Math.round((stats.closedComplaints / stats.totalComplaints) * 100)
    : 0

  const usersByRole = {
    student: users.filter(u => u.role === "student").length,
    worker: users.filter(u => u.role === "worker").length,
    warden: users.filter(u => u.role === "warden").length,
    admin: users.filter(u => u.role === "admin").length,
  }

  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

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
        <p className="text-base-content/60">Failed to load dashboard. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6 lg:p-10 space-y-8 max-w-full">

      {/* Notification */}
      {notification.show && (
        <div className={`alert alert-${notification.type === "success" ? "success" : "error"} shadow-lg fixed top-4 right-4 w-80 z-50`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-16 rounded-full ring ring-error ring-offset-base-100 ring-offset-2">
              <img
                src={`https://ui-avatars.com/api/?name=${user?.username}&background=DC2626&color=fff`}
                alt={user?.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Admin Panel</h1>
              <div className="badge badge-error badge-lg uppercase font-bold">
                Admin
              </div>
            </div>
            <p className="text-base-content/60 mt-1 font-medium">System Management & Oversight</p>
          </div>
        </div>

        <button
          onClick={fetchDashboardData}
          className="btn btn-primary btn-lg gap-2 shadow-md hover:shadow-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics Grid - First Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Complaints */}
        <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition">
          <div className="card-body p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Total Complaints
                </p>
                <p className="text-3xl font-bold mt-1">{stats.totalComplaints}</p>
              </div>
              <div className="p-3 rounded-xl bg-base-200">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition">
          <div className="card-body p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Total Users
                </p>
                <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
              </div>
              <div className="p-3 rounded-xl bg-base-200">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition">
          <div className="card-body p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Resolution Rate
                </p>
                <p className="text-3xl font-bold mt-1">{resolutionRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-base-200">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Workers */}
        <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition">
          <div className="card-body p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Active Workers
                </p>
                <p className="text-3xl font-bold mt-1">{stats.activeWorkers}</p>
              </div>
              <div className="p-3 rounded-xl bg-base-200">
                <Zap className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution - Second Row */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Open */}
        <div className="card bg-warning/5 border border-warning/20 shadow-md">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Open
                </p>
                <p className="text-2xl font-bold mt-1 text-warning">{stats.openComplaints}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="card bg-info/5 border border-info/20 shadow-md">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  In Progress
                </p>
                <p className="text-2xl font-bold mt-1 text-info">{stats.inProgressComplaints}</p>
              </div>
              <div className="p-2 rounded-lg bg-info/10">
                <Activity className="w-5 h-5 text-info" />
              </div>
            </div>
          </div>
        </div>

        {/* Closed */}
        <div className="card bg-success/5 border border-success/20 shadow-md">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Closed
                </p>
                <p className="text-2xl font-bold mt-1 text-success">{stats.closedComplaints}</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="card bg-primary/5 border border-primary/20 shadow-md">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Resolved Today
                </p>
                <p className="text-2xl font-bold mt-1 text-primary">{stats.resolvedToday}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-4 gap-6">

        {/* Complaints Management Section */}
        <div className="lg:col-span-2 card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body bg-gradient-to-r from-primary to-secondary/40 text-primary-content pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              <h2 className="card-title text-xl font-bold">Complaint Management</h2>
            </div>
            <p className="text-primary-content/80 font-medium text-sm">
              View and manage all system complaints
            </p>
          </div>

          {/* Filter Section */}
          <div className="divider m-0"></div>
          <div className="p-4 flex flex-col sm:flex-row gap-3 bg-base-50 border-b border-base-300">
            <select
              value={complaintFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="select select-bordered select-sm flex-1"
            >
              <option value="all">All Complaints ({allComplaints.length})</option>
              <option value="open">Open ({stats.openComplaints})</option>
              <option value="in_progress">In Progress ({stats.inProgressComplaints})</option>
              <option value="closed">Closed ({stats.closedComplaints})</option>
            </select>
          </div>

          {/* Complaints List */}
          <div className="divider m-0"></div>
          {displayComplaints.length === 0 ? (
            <div className="p-8 text-center text-base-content/60">
              <p>No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {displayComplaints.map((complaint) => (
                  <div key={complaint.id} className="p-4 bg-base-50 border border-base-200 rounded-lg hover:border-primary/50 transition">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base line-clamp-1">{complaint.title}</h3>
                        <p className="text-sm text-base-content/70 mt-1 line-clamp-1">{complaint.description}</p>
                      </div>
                      <div className={`badge ${
                        complaint.status === "open" ? "badge-warning" :
                        complaint.status === "in_progress" ? "badge-info" :
                        "badge-success"
                      }`}>
                        {complaint.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-base-content/60 mb-2">
                      <span className="badge badge-outline badge-sm">{complaint.category}</span>
                      <span className="badge badge-outline badge-sm">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-base-200">
                      {complaint.status !== "closed" && (
                        <button
                          onClick={() => handleMarkResolved(complaint.id)}
                          className="btn btn-sm btn-success btn-outline"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <Link href={`/complaints/${complaint.id}`} className="btn btn-sm btn-ghost flex-1">
                        View Details
                      </Link>
                      <button
                        onClick={() => handleDelete(complaint.id)}
                        className="btn btn-sm btn-error btn-outline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Statistics */}
        <div className="flex flex-col gap-6">

          {/* Users by Role */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users by Role
              </h3>
              <div className="space-y-3 mt-3 text-sm">
                <div className="flex justify-between p-2 bg-primary/10 rounded border border-primary/20">
                  <span className="font-medium">Students</span>
                  <span className="font-bold">{usersByRole.student}</span>
                </div>
                <div className="flex justify-between p-2 bg-secondary/10 rounded border border-secondary/20">
                  <span className="font-medium">Workers</span>
                  <span className="font-bold">{usersByRole.worker}</span>
                </div>
                <div className="flex justify-between p-2 bg-info/10 rounded border border-info/20">
                  <span className="font-medium">Wardens</span>
                  <span className="font-bold">{usersByRole.warden}</span>
                </div>
                <div className="flex justify-between p-2 bg-error/10 rounded border border-error/20">
                  <span className="font-medium">Admins</span>
                  <span className="font-bold">{usersByRole.admin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Categories
              </h3>
              <div className="space-y-2 mt-3">
                {topCategories.length === 0 ? (
                  <p className="text-sm text-base-content/60">No data</p>
                ) : (
                  topCategories.map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm capitalize font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-base-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(count / stats.totalComplaints) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-lg">Admin Controls</h3>
              <div className="space-y-2 mt-3">
                <Link href="/dashboard/admin/approvals" className="btn btn-sm btn-primary btn-block justify-start gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  User Approvals
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

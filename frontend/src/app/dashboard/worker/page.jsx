"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  ChevronRight,
  BarChart3,
  RefreshCw,
  Calendar
} from "lucide-react"

import api from "@/lib/api"

export default function WorkerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState([
    { label: "Assigned Tasks", value: "0", icon: Wrench, color: "text-blue-500" },
    { label: "Completed", value: "0", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "In Progress", value: "0", icon: Clock, color: "text-orange-500" },
  ])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch current user
      const userRes = await api.get("/api/v1/auth/me")
      const userData = userRes.data

      // Redirect if not worker
      if (userData.role !== "worker") {
        router.replace("/dashboard")
        return
      }

      // Redirect if not active
      if (userData.status !== "active") {
        router.replace("/auth/pending-approval")
        return
      }

      setUser(userData)

      // Fetch assigned tasks
      const tasksRes = await api.get("/api/v1/complaints/assigned")
      const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : []
      setTasks(allTasks)

      // Calculate stats
      const completed = allTasks.filter(t => t.status === "closed").length
      const inProgress = allTasks.filter(t => t.status === "in_progress").length
      const pending = allTasks.filter(t => t.status === "open").length

      setStats([
        { label: "Assigned Tasks", value: String(allTasks.length), icon: Wrench, color: "text-blue-500" },
        { label: "Completed", value: String(completed), icon: CheckCircle2, color: "text-emerald-500" },
        { label: "In Progress", value: String(inProgress), icon: Clock, color: "text-orange-500" },
      ])

    } catch (err) {
      console.error("Failed to load worker dashboard", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      setUpdating(true)
      await api.put(`/api/v1/complaints/${complaintId}`, { status: newStatus })
      await fetchDashboardData()
    } catch (err) {
      console.error("Failed to update status", err)
      alert("Failed to update status. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    if (filter !== "all") {
      filtered = filtered.filter(t => t.status === filter)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at)
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status)
      } else if (sortBy === "category") {
        return a.category.localeCompare(b.category)
      }
      return 0
    })

    return filtered
  }

  const filteredTasks = getFilteredTasks()

  const statusColors = {
    open: { badge: "badge-warning", dot: "bg-warning" },
    in_progress: { badge: "badge-info", dot: "bg-info" },
    closed: { badge: "badge-success", dot: "bg-success" }
  }

  const statusLabels = {
    open: "Open",
    in_progress: "In Progress",
    closed: "Completed"
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
        <p className="text-base-content/60">Failed to load dashboard. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={`https://ui-avatars.com/api/?name=${user?.username}&background=7C3AED&color=fff`}
                alt={user?.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight">My Tasks</h1>
              <div className="badge badge-primary badge-lg uppercase font-bold">
                Worker
              </div>
            </div>
            <p className="text-base-content/60 mt-1 font-medium">Welcome back, {user?.username}</p>
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

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition">
            <div className="card-body p-6 flex flex-row items-center justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="p-3 rounded-xl bg-base-200 shadow-inner">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">

        {/* Tasks List */}
        <div className="lg:col-span-3 card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body bg-gradient-to-r from-primary to-secondary/40 text-primary-content pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-6 h-6" />
              <h2 className="card-title text-2xl font-extrabold">
                My Assigned Tasks ({filteredTasks.length})
              </h2>
            </div>
          </div>

          {/* Filters & Sort */}
          <div className="divider m-0"></div>
          <div className="p-4 flex flex-col sm:flex-row gap-3 bg-base-50 border-b border-base-300">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="select select-bordered select-sm flex-1"
            >
              <option value="all">All Tasks</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select select-bordered select-sm flex-1"
            >
              <option value="created_at">Newest First</option>
              <option value="status">By Status</option>
              <option value="category">By Category</option>
            </select>
          </div>

          <div className="divider m-0"></div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
              <p className="text-base-content/60 font-medium">
                {filter === "all"
                  ? "No tasks assigned yet"
                  : `No ${filter.replace('_', ' ')} tasks`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="p-4 space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-base-50 border border-base-200 rounded-lg hover:border-primary/50 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${statusColors[task.status].dot}`}></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base line-clamp-1">{task.title}</h3>
                          <p className="text-sm text-base-content/70 mt-1 line-clamp-2">{task.description}</p>
                        </div>
                      </div>
                      <div className={`badge ${statusColors[task.status].badge} badge-md`}>
                        {statusLabels[task.status]}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-medium text-base-content/60 mb-3">
                      <span className="badge badge-outline badge-sm">{task.category}</span>
                      <span className="badge badge-outline badge-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {task.status !== "closed" && (
                      <div className="flex gap-2 pt-2 border-t border-base-200">
                        {task.status === "open" && (
                          <button
                            onClick={() => handleStatusUpdate(task.id, "in_progress")}
                            disabled={updating}
                            className="btn btn-sm btn-primary btn-outline flex-1"
                          >
                            Start Task
                          </button>
                        )}
                        {task.status === "in_progress" && (
                          <button
                            onClick={() => handleStatusUpdate(task.id, "closed")}
                            disabled={updating}
                            className="btn btn-sm btn-success btn-outline flex-1"
                          >
                            Mark Completed
                          </button>
                        )}
                        <Link
                          href={`/complaints/${task.id}`}
                          className="btn btn-sm btn-ghost flex-1"
                        >
                          View Details
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Quick Info */}
        <div className="flex flex-col gap-6">

          {/* Assigned Hostel */}
          {user?.hostel_name && (
            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg border border-primary/20">
              <div className="card-body">
                <h3 className="card-title text-lg flex items-center gap-2">
                  📍 Assigned Hostel
                </h3>
                <p className="text-2xl font-bold text-primary mt-2">{user.hostel_name}</p>
                {user?.specialization && (
                  <p className="text-sm text-base-content/70 mt-2">
                    Specialization: <span className="font-bold capitalize">{user.specialization}</span>
                  </p>
                )}
                <p className="text-xs text-base-content/60 mt-1">
                  All tasks are from this hostel
                </p>
              </div>
            </div>
          )}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Summary
              </h3>
              <div className="space-y-3 mt-3">
                <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <span className="text-sm font-medium">Open</span>
                  <span className="font-bold text-lg">{tasks.filter(t => t.status === "open").length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg border border-info/20">
                  <span className="text-sm font-medium">In Progress</span>
                  <span className="font-bold text-lg">{tasks.filter(t => t.status === "in_progress").length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="font-bold text-lg">{tasks.filter(t => t.status === "closed").length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-lg">Quick Actions</h3>
              <div className="space-y-2 mt-3">
                <Link href="/complaints" className="btn btn-sm btn-outline btn-block justify-start gap-2">
                  <ChevronRight className="w-4 h-4" />
                  View All Complaints
                </Link>
                <Link href="/profile" className="btn btn-sm btn-outline btn-block justify-start gap-2">
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Performance Card */}
          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg border border-primary/20">
            <div className="card-body">
              <h3 className="card-title text-lg font-bold">Performance</h3>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-base-content/70">
                  Completion Rate: <span className="font-bold text-primary">
                    {tasks.length > 0
                      ? Math.round((tasks.filter(t => t.status === "closed").length / tasks.length) * 100)
                      : 0}%
                  </span>
                </p>
                <p className="text-base-content/70">
                  Started Tasks: <span className="font-bold text-primary">
                    {tasks.filter(t => t.status !== "open").length}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

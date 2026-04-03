"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  PlusCircle,
  History,
  User,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ChevronRight,
  ArrowRightLeft,
  Wrench,
  ShieldCheck,
  UserPlus
} from "lucide-react"

import api from "@/lib/api"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState([
    { label: "Active Complaints", value: "0", icon: AlertCircle, color: "text-amber-500" },
    { label: "Resolved This Month", value: "0", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Avg. Resolution Time", value: "-", icon: Clock, color: "text-blue-500" },
  ])
  const [recentComplaints, setRecentComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch current user
      const userRes = await api.get("/api/v1/auth/me")
      const userData = userRes.data
      setUser(userData)

      // Fetch complaints based on user role
      let complaints = []
      const endpoint = userData.role === "worker" ? "/api/v1/complaints/assigned" : "/api/v1/complaints/my"
      const complaintsRes = await api.get(endpoint)
      
      complaints = Array.isArray(complaintsRes.data) ? complaintsRes.data : []
      
      // Only show the 2 most recent
      setRecentComplaints(complaints.slice(0, 2))

      // Calculate stats
      const total = complaints.length
      const resolved = complaints.filter(c => c.status === "closed").length
      setStats([
        { label: "Active Complaints", value: String(total - resolved), icon: AlertCircle, color: "text-amber-500" },
        { label: "Resolved This Month", value: String(resolved), icon: CheckCircle2, color: "text-emerald-500" },
        { label: "Avg. Resolution Time", value: "24h", icon: Clock, color: "text-blue-500" },
      ])
    } catch (err) {
      console.error("Failed to load dashboard data", err)
    } finally {
      setLoading(false)
    }
  }

  // Role-based navigation config
  const getRoleActions = () => {
    if (!user) return []
    switch (user.role) {
      case "student":
        return [
          { label: "Post New Complaint", icon: PlusCircle, href: "/complaints/new" },
          { label: "My Profile", icon: User, href: "/profile" },
          { label: "Resolution Archive", icon: History, href: "/archive" },
        ]
      case "warden":
        return [
          { label: "Forward Complaints", icon: ArrowRightLeft, href: "/forward" },
          { label: "Pending Approvals", icon: ShieldCheck, href: "/approvals" },
          { label: "Hostel Overview", icon: Settings, href: "/management" },
        ]
      case "worker":
        return [
          { label: "Update Task Status", icon: Wrench, href: "/tasks" },
          { label: "My Assignments", icon: History, href: "/assignments" },
          { label: "Profile", icon: User, href: "/profile" },
        ]
      case "admin":
        return [
          { label: "System Controls", icon: Settings, href: "/admin/settings" },
          { label: "Manage Wardens", icon: UserPlus, href: "/admin/wardens" },
          { label: "Override Status", icon: ShieldCheck, href: "/admin/status" },
        ]
      default:
        return []
    }
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
    <div className="min-h-screen bg-base-100 p-6 lg:p-10 pt-28 space-y-8 max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-16 rounded-full border-2 border-primary bg-primary text-primary-content flex items-center justify-center">
              <span className="text-2xl font-bold">{user?.username?.[0]?.toUpperCase() || '?'}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold">Dashboard</h1>
              <div className="badge badge-primary uppercase">
                {user?.role || 'loading'}
              </div>
            </div>
            <p className="text-base-content/60 mt-1 font-medium">Welcome back, {user?.username || 'User'}</p>
          </div>
        </div>
        
        {user?.role === "student" && (
          <Link href="/complaints">
            <button className="btn btn-primary btn-lg gap-2">
              <PlusCircle className="w-4 h-4" />
              File New Complaint
            </button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card bg-base-200 shadow-lg">
            <div className="card-body p-6 flex flex-row items-center justify-between">
              <div>
                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="p-3 rounded-lg bg-base-100">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Main Overview Card */}
        <div className="lg:col-span-2 card bg-base-200 shadow-lg">
          <div className="card-body bg-primary text-primary-content pb-6">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6" />
              <h2 className="card-title text-2xl font-bold">
                {user.role === 'worker' ? 'Assigned Tasks' : 'Recent Complaints'}
              </h2>
            </div>
            <p className="text-primary-content/80 font-medium">
              {user.role === 'student' ? 'Your most recent issues.' : 'Overview of active hostel tickets.'}
            </p>
          </div>
          <div className="divider m-0"></div>
          <div className="card-body p-0">
            {recentComplaints.length > 0 ? (
              <>
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="p-5 flex items-center justify-between hover:bg-base-100 transition-colors border-b border-base-300 last:border-b-0">
                    <div className="flex gap-4 items-center flex-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        complaint.status === 'closed' ? 'bg-success' : 
                        complaint.status === 'in_progress' ? 'bg-info' : 
                        'bg-warning'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-bold text-sm line-clamp-1">{complaint.title}</p>
                        <p className="text-xs text-base-content/60 mt-0.5 font-medium">
                          Status: {complaint.status.replace('_', ' ')} • {complaint.category}
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm">
                      {user?.role === 'worker' ? 'Update Status' : 'View Details'}
                    </button>
                  </div>
                ))}
                <Link href="/complaints" className="flex items-center justify-center p-4 text-xs font-bold uppercase tracking-widest hover:bg-base-100 transition-colors border-t border-base-300 text-base-content/60 hover:text-primary">
                  See All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </>
            ) : (
              <div className="p-5 text-center text-base-content/60">
                No complaints yet. All systems operational!
              </div>
            )}
          </div>
        </div>

        {/* Side Menu */}
        <div className="flex flex-col gap-6">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl font-bold">Quick Actions</h2>
              <div className="space-y-2 mt-3">
                {getRoleActions().map((action) => (
                  <Link key={action.label} href={action.href}>
                    <button className="btn btn-outline w-full justify-start gap-3 border-base-300">
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* IIT Jodhpur Notice Banner */}
          <div className="card bg-base-200 shadow-lg overflow-hidden">
            <div className="card-body bg-gradient-to-br from-base-300 to-base-200 p-6">
              <div className="badge badge-primary mb-2">OFFICIAL NOTICE</div>
              <h3 className="font-bold text-xl uppercase">H10 Network Maintenance</h3>
              <p className="text-sm text-base-content/70 mt-2">
                Downtime expected tomorrow from 2 PM to 4 PM for router upgrades.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Zap,
  Trash2,
  Network,
  Brush,
  Loader2,
  ChevronRight
} from "lucide-react"

const getCategoryIcon = (category) => {
  switch (category) {
    case "plumbing": return <Wrench className="w-4 h-4" />
    case "electrical": return <Zap className="w-4 h-4" />
    case "network": return <Network className="w-4 h-4" />
    case "cleanliness": return <Brush className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints")
      setComplaints(res.data.complaints || []) 
    } catch (err) {
      showNotification("Failed to load complaints", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/complaints/${id}`)
      showNotification("Complaint deleted successfully", "success")
      setComplaints(complaints.filter(c => c.id !== id))
    } catch (err) {
      showNotification("Deletion failed: Permission denied", "error")
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000)
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Notification */}
      {notification.show && (
        <div className={`alert alert-${notification.type === 'error' ? 'error' : 'success'}`}>
          <span>{notification.message}</span>
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Complaints</h1>
          <p className="text-base-content/60 mt-1 font-medium">Resolution Center • IIT Jodhpur</p>
        </div>
        <button className="btn btn-primary btn-lg gap-2">
          <Plus className="w-5 h-5" /> New Complaint
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input 
            type="text"
            placeholder="Search by title or ID..." 
            className="input input-bordered w-full pl-10 bg-base-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-outline gap-2 border-base-300">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 rounded-lg bg-base-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.length > 0 ? complaints.map((c) => (
            <div key={c.id} className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className={`badge ${getStatusBadge(c.status)}`}>
                    {c.status === 'in_progress' ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    {c.status.replace('_', ' ')}
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="card-title text-lg line-clamp-1 mt-4">
                  {c.title}
                </h3>
                <p className="text-sm text-base-content/70 line-clamp-2">
                  {c.description}
                </p>

                <div className="divider my-2"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <div>{getCategoryIcon(c.category)}</div>
                    <span className="uppercase font-bold">{c.category}</span>
                  </div>
                  <span className="text-xs text-base-content/50 font-mono">ID: #{c.id}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-base-content/60 font-bold">No complaints found. All systems operational.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getStatusBadge(status) {
  switch (status) {
    case "open": return "badge-warning"
    case "in_progress": return "badge-info"
    case "closed": return "badge-success"
    default: return "badge-ghost"
  }
}
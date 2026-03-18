"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { CheckCircle2, AlertCircle, Clock, Trash2 } from "lucide-react"

export default function Admin() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints")
      setComplaints(res.data.complaints || res.data || [])
      setLoading(false)
    } catch (err) {
      showNotification("Failed to load complaints", "error")
      setLoading(false)
    }
  }

  const handleMarkResolved = async (id) => {
    try {
      await api.patch(`/complaints/${id}`, { status: "closed" })
      showNotification("Complaint marked as resolved", "success")
      setComplaints(complaints.map(c => c.id === id ? { ...c, status: "closed" } : c))
    } catch (err) {
      showNotification("Failed to update complaint", "error")
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/complaints/${id}`)
      showNotification("Complaint deleted", "success")
      setComplaints(complaints.filter(c => c.id !== id))
    } catch (err) {
      showNotification("Failed to delete complaint", "error")
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "closed": return <CheckCircle2 className="w-4 h-4 text-success" />
      case "in_progress": return <Clock className="w-4 h-4 text-info" />
      default: return <AlertCircle className="w-4 h-4 text-warning" />
    }
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 lg:p-10 pt-28 max-w-6xl mx-auto space-y-6">
      
      {/* Notification */}
      {notification.show && (
        <div className={`alert alert-${notification.type === 'error' ? 'error' : 'success'} alert-dismissible`}>
          <span>{notification.message}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setNotification({ show: false, message: "", type: "" })}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-base-content/60">Manage and oversee all hostel complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <p className="text-sm font-bold text-base-content/60 uppercase">Total Complaints</p>
            <p className="text-3xl font-bold">{complaints.length}</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <p className="text-sm font-bold text-base-content/60 uppercase">In Progress</p>
            <p className="text-3xl font-bold">{complaints.filter(c => c.status === "in_progress").length}</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <p className="text-sm font-bold text-base-content/60 uppercase">Resolved</p>
            <p className="text-3xl font-bold">{complaints.filter(c => c.status === "closed").length}</p>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">All Complaints</h2>
          
          {loading ? (
            <div className="py-8 text-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-8 text-center text-base-content/60">
              No complaints found
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {complaints.map(c => (
                <div key={c.id} className="bg-base-100 p-4 rounded-lg flex items-start justify-between hover:shadow transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(c.status)}
                      <h3 className="font-bold text-lg">{c.title}</h3>
                      <span className={`badge ${c.status === 'closed' ? 'badge-success' : c.status === 'in_progress' ? 'badge-info' : 'badge-warning'}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/70 mb-2">{c.description}</p>
                    <div className="text-xs text-base-content/50">
                      <span className="badge badge-ghost mr-2">ID: #{c.id}</span>
                      <span className="badge badge-ghost">{c.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {c.status !== "closed" && (
                      <button 
                        className="btn btn-sm btn-success gap-1"
                        onClick={() => handleMarkResolved(c.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Resolve
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-error btn-outline"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
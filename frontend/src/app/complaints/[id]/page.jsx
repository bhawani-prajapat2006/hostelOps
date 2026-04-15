"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import {
  ArrowLeft,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Tag,
  FileText,
  Wrench,
  Zap,
  Network,
  Brush,
  History,
  Edit3,
  Save,
  X
} from "lucide-react"

const getCategoryIcon = (category) => {
  switch (category) {
    case "plumbing": return <Wrench className="w-5 h-5" />
    case "electrical": return <Zap className="w-5 h-5" />
    case "network": return <Network className="w-5 h-5" />
    case "cleanliness": return <Brush className="w-5 h-5" />
    case "furniture": return <AlertCircle className="w-5 h-5" />
    default: return <AlertCircle className="w-5 h-5" />
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case "open": return "badge-warning"
    case "in_progress": return "badge-info"
    case "closed": return "badge-success"
    default: return "badge-neutral"
  }
}

export default function ComplaintDetailPage() {
  const router = useRouter()
  const params = useParams()
  const complaintId = params.id

  const [complaint, setComplaint] = useState(null)
  const [creatorData, setCreatorData] = useState(null)
  const [assignedWorkerData, setAssignedWorkerData] = useState(null)
  const [history, setHistory] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    fetchData()
  }, [complaintId])

  const addToast = (message, type) => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [userRes, complaintRes, historyRes] = await Promise.all([
        api.get("/api/v1/auth/me"),
        api.get(`/api/v1/complaints/${complaintId}`),
        api.get(`/api/v1/complaints/${complaintId}/history`)
      ])

      // Check if user is active
      if (userRes.data.status !== "active") {
        router.replace("/auth/pending-approval")
        return
      }

      setUser(userRes.data)
      setComplaint(complaintRes.data)
      setNewStatus(complaintRes.data.status)
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : [])

      // If the logged-in user is the creator, use their data directly
      if (userRes.data.id === complaintRes.data.created_by) {
        setCreatorData(userRes.data)
      }

    } catch (err) {
      addToast("Failed to load complaint details", "error")
      setTimeout(() => router.push("/complaints"), 2000)
    } finally {
      setLoading(false)
    }
  }

  const canUpdateStatus = user && ["worker", "warden", "admin"].includes(user.role)
  const canDelete = user && (user.id === complaint?.created_by || ["warden", "admin"].includes(user.role))

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/api/v1/complaints/${complaintId}`)
      addToast("Complaint deleted successfully!", "success")
      setTimeout(() => router.push("/complaints"), 1500)
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to delete complaint", "error")
    } finally {
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (newStatus === complaint.status) {
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      const res = await api.put(`/api/v1/complaints/${complaintId}`, { status: newStatus })
      setComplaint(res.data)
      await fetchData()
      setEditing(false)
      addToast("Status updated successfully!", "success")
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to update status", "error")
      setNewStatus(complaint.status)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="bg-base-100 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-error" />
          <p className="text-lg font-bold">Complaint not found</p>
          <Link href="/complaints" className="btn btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Complaints
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-base-100 p-6 lg:p-10 max-w-5xl mx-auto space-y-8">

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert ${toast.type === "error" ? "alert-error" : "alert-success"} shadow-lg`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/complaints" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold">{complaint.title}</h1>
        </div>
        <div className="flex gap-2">
          {canDelete && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="btn btn-error btn-outline btn-sm gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-error" />
              Delete Complaint?
            </h2>
            <p className="text-base-content/70">
              This action cannot be undone. The complaint will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="btn btn-ghost flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-error flex-1 gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card - Basic Info */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body space-y-6">

              {/* Status Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Status Progress</h3>
                  <div className={`badge badge-lg ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {["open", "in_progress", "closed"].map((status, idx) => (
                    <div key={status} className="flex items-center flex-1">
                      <div className={`w-full h-2 rounded-full transition-colors ${
                        ["open", "in_progress", "closed"].indexOf(status) <= ["open", "in_progress", "closed"].indexOf(complaint.status)
                          ? "bg-primary"
                          : "bg-base-300"
                      }`}></div>
                      {idx < 2 && <div className="h-1 w-2 bg-base-content/20"></div>}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs text-base-content/60 font-mono">
                  <span>Open</span>
                  <span>In Progress</span>
                  <span>Closed</span>
                </div>
              </div>

              <div className="divider my-4"></div>

              {/* Description */}
              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Description
                </h3>
                <p className="text-sm leading-relaxed bg-base-100 p-4 rounded-lg whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              {/* Image */}
              {complaint.image_url && (
                <div>
                  <h3 className="font-bold mb-2">Attached Image</h3>
                  <img
                    src={complaint.image_url}
                    alt="Complaint"
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card - History */}
          {history.length > 0 && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h3 className="card-title flex items-center gap-2 mb-4">
                  <History className="w-5 h-5" />
                  Status History
                </h3>

                <div className="space-y-3">
                  {history.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-4 p-3 bg-base-100 rounded-lg text-sm">
                      <div className="pt-1">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        {idx < history.length - 1 && (
                          <div className="w-0.5 h-8 bg-base-300 mx-1.5 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {entry.old_status || "Created"} → {entry.new_status}
                        </p>
                        {entry.comment && (
                          <p className="text-xs text-base-content/60 mt-1">{entry.comment}</p>
                        )}
                        <p className="text-xs text-base-content/50 mt-1">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info Panel */}
        <div className="space-y-4">

          {/* Card - Quick Info */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body space-y-4">

              {/* Complaint ID */}
              <div className="text-center pb-2 border-b border-base-300">
                <p className="text-xs text-base-content/60 uppercase">Complaint ID</p>
                <p className="text-2xl font-mono font-bold">#{complaint.id}</p>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-base-content/60 uppercase font-bold mb-2">Category</p>
                <div className="flex items-center gap-2 bg-base-100 p-3 rounded-lg">
                  {getCategoryIcon(complaint.category)}
                  <span className="font-bold uppercase text-sm">{complaint.category}</span>
                </div>
              </div>

              {/* Created By */}
              <div>
                <p className="text-xs text-base-content/60 uppercase font-bold mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" /> Filed By
                </p>
                <p className="text-sm font-semibold bg-base-100 p-3 rounded-lg">
                  {user?.id === complaint.created_by
                    ? user?.username
                    : creatorData?.username || `User #${complaint.created_by}`}
                </p>
              </div>

              {/* Assigned To */}
              <div>
                <p className="text-xs text-base-content/60 uppercase font-bold mb-2 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Assigned To
                </p>
                {complaint.assigned_worker ? (
                  <div className="text-sm font-semibold bg-base-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span>{complaint.assigned_worker.username}</span>
                      {complaint.assigned_worker.work_type && (
                        <span className="badge badge-sm badge-info">{complaint.assigned_worker.work_type}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold bg-base-100 p-3 rounded-lg text-base-content/50">
                    Unassigned
                  </p>
                )}
              </div>

              {/* Created At */}
              <div>
                <p className="text-xs text-base-content/60 uppercase font-bold mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Created
                </p>
                <p className="text-xs bg-base-100 p-3 rounded-lg font-mono">
                  {new Date(complaint.created_at).toLocaleString()}
                </p>
              </div>

              {/* Updated At */}
              <div>
                <p className="text-xs text-base-content/60 uppercase font-bold mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated
                </p>
                <p className="text-xs bg-base-100 p-3 rounded-lg font-mono">
                  {new Date(complaint.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Card - Status Update (only for workers/wardens/admins) */}
          {canUpdateStatus && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-base mb-4 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Update Status
                </h3>

                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn btn-primary btn-sm w-full"
                  >
                    Change Status
                  </button>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="select select-bordered w-full bg-base-100"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={handleStatusUpdate}
                        className="btn btn-success btn-sm flex-1 gap-1"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false)
                          setNewStatus(complaint.status)
                        }}
                        className="btn btn-ghost btn-sm flex-1 gap-1"
                        disabled={saving}
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
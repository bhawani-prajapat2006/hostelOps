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
  ChevronRight,
  Send,
  X
} from "lucide-react"

const getCategoryIcon = (category) => {
  switch (category) {
    case "plumbing": return <Wrench className="w-4 h-4" />
    case "electrical": return <Zap className="w-4 h-4" />
    case "network": return <Network className="w-4 h-4" />
    case "cleanliness": return <Brush className="w-4 h-4" />
    case "furniture": return <AlertCircle className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing", icon: Wrench },
  { value: "electrical", label: "Electrical", icon: Zap },
  { value: "cleanliness", label: "Cleanliness", icon: Brush },
  { value: "network", label: "Network", icon: Network },
  { value: "furniture", label: "Furniture", icon: AlertCircle },
  { value: "other", label: "Other", icon: AlertCircle },
]

export default function Complaints() {
  const [user, setUser] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    image_url: "",
  })

  useEffect(() => {
    fetchUserAndComplaints()
  }, [])

  const fetchUserAndComplaints = async () => {
    try {
      // First get current user
      const userRes = await api.get("/api/v1/auth/me")
      const userData = userRes.data
      setUser(userData)

      // Then fetch complaints based on role
      let endpoint
      if (userData.role === "worker") {
        endpoint = "/api/v1/complaints/assigned"
      } else {
        endpoint = "/api/v1/complaints/my"
      }

      const res = await api.get(endpoint)
      setComplaints(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      showNotification("Failed to load complaints", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchComplaints = async () => {
    try {
      // Refetch complaints based on user role
      let endpoint
      if (user?.role === "worker") {
        endpoint = "/api/v1/complaints/assigned"
      } else {
        endpoint = "/api/v1/complaints/my"
      }

      const res = await api.get(endpoint)
      setComplaints(Array.isArray(res.data) ? res.data : []) 
    } catch (err) {
      showNotification("Failed to load complaints", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/complaints/${id}`)
      showNotification("Complaint deleted successfully", "success")
      setComplaints(complaints.filter(c => c.id !== id))
    } catch (err) {
      showNotification("Deletion failed: Permission denied", "error")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (formData.title.trim().length < 3) {
        showNotification("Title must be at least 3 characters", "error")
        setSubmitting(false)
        return
      }

      if (formData.description.trim().length < 10) {
        showNotification("Description must be at least 10 characters", "error")
        setSubmitting(false)
        return
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        ...(formData.image_url && { image_url: formData.image_url })
      }

      await api.post("/api/v1/complaints", payload)
      showNotification("Complaint filed successfully!", "success")
      
      setFormData({
        title: "",
        description: "",
        category: "other",
        image_url: "",
      })
      setModalOpen(false)
      fetchComplaints()
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to file complaint", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormData({
      title: "",
      description: "",
      category: "other",
      image_url: "",
    })
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
        <button 
          onClick={() => setModalOpen(true)}
          className="btn btn-primary btn-lg gap-2"
        >
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">File a New Complaint</h2>
                <p className="text-sm text-base-content/60 mt-1">
                  Describe your issue and our team will look into it promptly
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Title Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Title</span>
                  <span className="label-text-alt text-xs text-base-content/60">
                    {formData.title.length}/256
                  </span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Brief summary of the issue"
                  className="input input-bordered bg-base-200"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength="256"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-xs text-base-content/50">
                    Minimum 3 characters • Maximum 256 characters
                  </span>
                </label>
              </div>

              {/* Category Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Category</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <label key={cat.value} className="cursor-pointer flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={formData.category === cat.value}
                        onChange={handleChange}
                        className="radio radio-sm"
                      />
                      <span className="ml-2 text-sm font-medium flex items-center gap-1">
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Description</span>
                  <span className="label-text-alt text-xs text-base-content/60">
                    {formData.description.length}/5000
                  </span>
                </label>
                <textarea
                  name="description"
                  placeholder="Provide detailed information about the issue..."
                  className="textarea textarea-bordered bg-base-200 h-24"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength="5000"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-xs text-base-content/50">
                    Minimum 10 characters • Maximum 5000 characters
                  </span>
                </label>
              </div>

              {/* Image URL Field (Optional) */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Image URL</span>
                  <span className="badge badge-sm badge-outline">Optional</span>
                </label>
                <input
                  type="url"
                  name="image_url"
                  placeholder="https://example.com/image.jpg"
                  className="input input-bordered bg-base-200"
                  value={formData.image_url}
                  onChange={handleChange}
                />
                <label className="label">
                  <span className="label-text-alt text-xs text-base-content/50">
                    Provide a URL to an image that shows the issue (external link)
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1 gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Filing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      File Complaint
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
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
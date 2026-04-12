"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import {
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  const [formData, setFormData] = useState({
    phone: "",
    hostel_name: "",
    room_number: "",
    batch: "",
  })

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/v1/auth/me")
      setUser(res.data)
      setFormData({
        phone: res.data.phone || "",
        hostel_name: res.data.hostel_name || "",
        room_number: res.data.room_number || "",
        batch: res.data.batch || "",
      })
    } catch (err) {
      showNotification("Failed to load profile", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Build payload based on role
      const payload = { phone: formData.phone || undefined }

      if (user?.role === "student") {
        payload.hostel_name = formData.hostel_name || undefined
        payload.room_number = formData.room_number || undefined
        payload.batch = formData.batch || undefined
      }

      // Remove undefined values
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

      const res = await api.put("/api/v1/auth/me", payload)
      setUser(res.data)
      showNotification("Profile updated successfully!", "success")
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to update profile", "error")
    } finally {
      setSaving(false)
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000)
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
        <p className="text-base-content/60">Failed to load profile</p>
      </div>
    )
  }

  // Role-specific role descriptions
  const getRoleDescription = (role) => {
    switch(role) {
      case "student":
        return "Student - Can create and view complaints"
      case "worker":
        return "Worker - Assigned maintenance tasks"
      case "warden":
        return "Warden - Manages hostel"
      case "admin":
        return "Administrator - System management"
      default:
        return role
    }
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 lg:p-10 max-w-4xl mx-auto space-y-8">

      {/* Notification */}
      {notification.show && (
        <div className={`alert alert-${notification.type === 'error' ? 'error' : 'success'}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">My Profile</h1>
        <p className="text-base-content/60 mt-2">{getRoleDescription(user?.role)}</p>
      </div>

      {/* Profile Card */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          {/* User Info Section */}
          <div className="space-y-6 mb-6">
            {/* Avatar & Role */}
            <div className="flex items-center gap-6">
              <div className="avatar placeholder">
                <div className="w-24 rounded-full bg-primary text-primary-content flex items-center justify-center text-3xl font-bold">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user?.username}&background=0D8ABC&color=fff&size=96`}
                    alt={user?.username}
                  />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.username}</h2>
                <div className="badge badge-primary uppercase mt-2">{user?.role}</div>
                {user?.status === "pending" && (
                  <div className="badge badge-warning uppercase mt-2 ml-2">Pending Approval</div>
                )}
              </div>
            </div>

            {/* Read-only Fields */}
            <div className="divider my-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </span>
                </label>
                <input
                  type="email"
                  value={user?.email}
                  className="input input-bordered bg-base-100"
                  disabled
                />
                <label className="label">
                  <span className="label-text-alt text-xs text-base-content/50">
                    Email cannot be changed
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Joined
                  </span>
                </label>
                <input
                  type="text"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  className="input input-bordered bg-base-100"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Editable Form */}
          <div className="divider my-6"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone - Available for all roles */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-bold flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 XXXXX XXXXX"
                  className="input input-bordered"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength="15"
                />
              </div>

              {/* Student-specific fields */}
              {user?.role === "student" && (
                <>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold flex items-center gap-2">
                        <Home className="w-4 h-4" /> Hostel Name
                      </span>
                      <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="hostel_name"
                      placeholder="e.g., H1, H2, H3..."
                      className="input input-bordered"
                      value={formData.hostel_name}
                      onChange={handleChange}
                      maxLength="100"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Required for creating complaints
                      </span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold flex items-center gap-2">
                        <Home className="w-4 h-4" /> Room Number
                      </span>
                      <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="room_number"
                      placeholder="e.g., 101, 202..."
                      className="input input-bordered"
                      value={formData.room_number}
                      onChange={handleChange}
                      maxLength="20"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-xs text-base-content/50">
                        Required for creating complaints
                      </span>
                    </label>
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Batch/Year
                      </span>
                    </label>
                    <input
                      type="text"
                      name="batch"
                      placeholder="e.g., 2024, 2025..."
                      className="input input-bordered"
                      value={formData.batch}
                      onChange={handleChange}
                      maxLength="20"
                    />
                  </div>
                </>
              )}

              {/* Worker/Warden assigned hostel - read only */}
              {(user?.role === "worker" || user?.role === "warden") && (
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-bold flex items-center gap-2">
                      <Home className="w-4 h-4" /> Assigned Hostel
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.hostel_name || "Not assigned yet"}
                    className="input input-bordered bg-base-100"
                    disabled
                  />
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/50">
                      {user?.role === "worker"
                        ? "Assigned by: Warden - Contact your warden for hostel assignment"
                        : "Assigned by: Admin - Contact your admin for hostel assignment"}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => fetchUser()}
                className="btn btn-outline"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Role-specific info boxes */}
      {user?.role === "student" && (
        <div className="alert bg-info/10 border-info/30 text-info-content">
          <CheckCircle2 className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Complete Your Profile</h3>
            <p className="text-xs mt-1">
              Hostel name and room number are required to create complaints. Once filled, you can report issues from your hostel.
            </p>
          </div>
        </div>
      )}

      {user?.role === "worker" && !formData.hostel_name && (
        <div className="alert bg-warning/10 border-warning/30 text-warning-content">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">⚠️ WORKER: No Hostel Assigned</h3>
            <p className="text-xs mt-1">
              {user?.status === "pending"
                ? "🔄 PENDING: Once the ADMIN approves you → Your WARDEN will assign you to a hostel."
                : "📞 ACTIVE: Contact your WARDEN for hostel assignment immediately."}
            </p>
            <p className="text-xs text-base-content/50 mt-2">[role={user?.role}, status={user?.status}]</p>
          </div>
        </div>
      )}

      {user?.role === "warden" && !formData.hostel_name && (
        <div className="alert bg-warning/10 border-warning/30 text-warning-content">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">⚠️ WARDEN: No Hostel Assigned</h3>
            <p className="text-xs mt-1">
              {user?.status === "pending"
                ? "🔄 PENDING: Once the ADMIN approves you → The ADMIN will assign you to manage a hostel."
                : "📞 ACTIVE: Contact the ADMIN to get assigned to manage a specific hostel."}
            </p>
            <p className="text-xs text-base-content/50 mt-2">[role={user?.role}, status={user?.status}]</p>
          </div>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="alert bg-success/10 border-success/30 text-success-content">
          <CheckCircle2 className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Administrator Account</h3>
            <p className="text-xs mt-1">
              You have full system access. Visit the admin dashboard to manage users, hostels, and approvals.
            </p>
          </div>
        </div>
      )}

      {/* General Security Info */}
      <div className="alert bg-base-200 border-base-300">
        <AlertCircle className="w-5 h-5" />
        <div>
          <h3 className="font-bold">Account Security</h3>
          <p className="text-xs text-base-content/70 mt-1">
            Your email and role are fixed for security. To change them, contact the administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

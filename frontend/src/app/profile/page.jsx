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
  const [hostels, setHostels] = useState([])
  const [selectedHostel, setSelectedHostel] = useState(null)

  const [formData, setFormData] = useState({
    phone: "",
    hostel_name: "",
    room_number: "",
    batch: "",
    work_type: "",
  })

  // Generate room numbers dynamically based on selected hostel's total_rooms
  const generateRoomNumbers = () => {
    if (!selectedHostel || !selectedHostel.total_rooms) {
      return []
    }
    const rooms = []
    for (let i = 1; i <= selectedHostel.total_rooms; i++) {
      rooms.push(String(i))
    }
    return rooms
  }
  const roomNumbers = generateRoomNumbers()

  useEffect(() => {
    // Fetch hostels first, then user data
    const loadData = async () => {
      await fetchHostels()
      await fetchUser()
    }
    loadData()
  }, [])

  // Update selectedHostel when formData or hostels change
  useEffect(() => {
    if (formData.hostel_name && hostels.length > 0) {
      const hostel = hostels.find(h => h.name === formData.hostel_name)
      setSelectedHostel(hostel || null)
    }
  }, [hostels, formData.hostel_name])

  const fetchHostels = async () => {
    try {
      const res = await api.get("/api/v1/hostels/")
      const hostelsList = Array.isArray(res.data) ? res.data : []
      setHostels(hostelsList)
    } catch (err) {
      console.error("Failed to load hostels:", err)
    }
  }

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/v1/auth/me")
      setUser(res.data)
      setFormData({
        phone: res.data.phone || "",
        hostel_name: res.data.hostel_name || "",
        room_number: res.data.room_number || "",
        batch: res.data.batch || "",
        work_type: res.data.work_type || "",
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

    // When hostel is changed, update selectedHostel and clear room_number
    if (name === "hostel_name") {
      const hostel = hostels.find(h => h.name === value)
      setSelectedHostel(hostel || null)
      setFormData(prev => ({ ...prev, room_number: "" })) // Clear room when hostel changes
    }
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

        // Validate hostel is selected
        if (!formData.hostel_name) {
          showNotification("Please select a hostel", "error")
          setSaving(false)
          return
        }

        // Look up hostel_id by finding hostel with matching name
        const hostel = hostels.find(h => h.name === formData.hostel_name)
        if (!hostel || !hostel.id) {
          showNotification("Hostel not found. Please refresh and try again.", "error")
          setSaving(false)
          return
        }

        console.log("Sending hostel_id:", hostel.id, "for hostel:", formData.hostel_name)
        payload.hostel_id = hostel.id
      }

      if (user?.role === "worker") {
        payload.work_type = formData.work_type || undefined
      }

      // Remove undefined values
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

      console.log("Profile update payload:", payload)
      const res = await api.put("/api/v1/auth/me", payload)
      console.log("Profile response:", res.data)
      setUser(res.data)
      showNotification("Profile updated successfully!", "success")
    } catch (err) {
      console.error("Profile update error:", err)
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
                    <select
                      name="hostel_name"
                      className="select select-bordered"
                      value={formData.hostel_name}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select your hostel...</option>
                      {hostels.map(hostel => (
                        <option key={hostel.id} value={hostel.name}>
                          {hostel.name}
                        </option>
                      ))}
                    </select>
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
                    <select
                      name="room_number"
                      className="select select-bordered"
                      value={formData.room_number}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select your room...</option>
                      {roomNumbers.map(room => (
                        <option key={room} value={room}>
                          Room {room}
                        </option>
                      ))}
                    </select>
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
              {(user?.role === "warden") && (
                <>
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
                        Assigned by: Admin - Contact your admin for hostel assignment
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Worker Work Type */}
              {user?.role === "worker" && (
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-bold">Work Type</span>
                  </label>
                  <select
                    name="work_type"
                    className="select select-bordered"
                    value={formData.work_type}
                    onChange={handleChange}
                  >
                    <option value="">Select your work type...</option>
                    <option value="plumbing">🔧 Plumbing</option>
                    <option value="electrical">⚡ Electrical</option>
                    <option value="cleanliness">🧹 Cleanliness</option>
                    <option value="network">📡 Network</option>
                    <option value="furniture">🪑 Furniture</option>
                    <option value="other">📋 Other</option>
                  </select>
                  <label className="label">
                    <span className="label-text-alt text-xs text-base-content/50">
                      Select the type of work you do - this determines which complaints you can be assigned to
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

      {user?.role === "worker" && !formData.work_type && (
        <div className="alert bg-warning/10 border-warning/30 text-warning-content">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">⚠️ WORKER: Set Your Work Type</h3>
            <p className="text-xs mt-1">
              Your work type determines which complaints you can be assigned to. Select your specialization above.
            </p>
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

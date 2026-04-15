"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Home,
  Map,
  DoorOpen,
  User,
  Loader2,
  X,
  Save,
  ChevronLeft
} from "lucide-react"

export default function AdminHostelsPage() {
  const router = useRouter()
  const [hostels, setHostels] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingHostel, setEditingHostel] = useState(null)
  const [assignWardenModalOpen, setAssignWardenModalOpen] = useState(false)
  const [hostelUsersModalOpen, setHostelUsersModalOpen] = useState(false)
  const [selectedHostelForAssign, setSelectedHostelForAssign] = useState(null)
  const [selectedWarden, setSelectedWarden] = useState(null)
  const [hostelUsers, setHostelUsers] = useState([])

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    total_rooms: "",
    capacity: "",
    description: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [hostelRes, userRes] = await Promise.all([
        api.get("/api/v1/hostels/"),
        api.get("/api/v1/users/?page_size=100"),
      ])
      setHostels(Array.isArray(hostelRes.data) ? hostelRes.data : [])
      const allUsers = Array.isArray(userRes.data?.users) ? userRes.data.users : []
      setUsers(allUsers.filter(u => u.role === "warden"))
    } catch (err) {
      showNotification("Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateHostel = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        address: formData.address || undefined,
        total_rooms: formData.total_rooms ? parseInt(formData.total_rooms) : undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        description: formData.description || undefined,
      }

      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

      if (editingHostel) {
        await api.put(`/api/v1/hostels/${editingHostel.id}`, payload)
        showNotification("Hostel updated successfully!", "success")
      } else {
        await api.post("/api/v1/hostels/", payload)
        showNotification("Hostel created successfully!", "success")
      }

      setFormData({ name: "", address: "", total_rooms: "", capacity: "", description: "" })
      setCreateModalOpen(false)
      setEditingHostel(null)
      await fetchData()
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to save hostel", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditHostel = (hostel) => {
    setEditingHostel(hostel)
    setFormData({
      name: hostel.name,
      address: hostel.address || "",
      total_rooms: hostel.total_rooms || "",
      capacity: hostel.capacity || "",
      description: hostel.description || "",
    })
    setCreateModalOpen(true)
  }

  const handleDeleteHostel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hostel?")) return

    try {
      await api.delete(`/api/v1/hostels/${id}`)
      showNotification("Hostel deleted successfully!", "success")
      await fetchData()
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to delete hostel", "error")
    }
  }

  const handleAssignWarden = async () => {
    if (!selectedWarden || !selectedHostelForAssign) {
      showNotification("Please select a warden", "error")
      return
    }

    try {
      setSubmitting(true)
      await api.post(
        `/api/v1/hostels/${selectedHostelForAssign.id}/assign-warden/${selectedWarden}`,
        {}
      )
      showNotification("Warden assigned successfully!", "success")
      setAssignWardenModalOpen(false)
      setSelectedWarden(null)
      setSelectedHostelForAssign(null)
      await fetchData()
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to assign warden", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const fetchHostelUsers = async (hostelId) => {
    try {
      const res = await api.get(`/api/v1/hostels/${hostelId}/users`)
      setHostelUsers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      showNotification("Failed to load hostel users", "error")
    }
  }

  const handleOpenHostelUsers = async (hostel) => {
    setSelectedHostelForAssign(hostel)
    setHostelUsersModalOpen(true)
    await fetchHostelUsers(hostel.id)
  }

  const handleUnassignUser = async (userId) => {
    if (!window.confirm("Are you sure you want to unassign this user from the hostel?")) return

    try {
      setSubmitting(true)
      await api.post(`/api/v1/hostels/${selectedHostelForAssign.id}/unassign/${userId}`, {})
      showNotification("User unassigned successfully!", "success")
      await fetchHostelUsers(selectedHostelForAssign.id)
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to unassign user", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const closeCreateModal = () => {
    setCreateModalOpen(false)
    setEditingHostel(null)
    setFormData({ name: "", address: "", total_rooms: "", capacity: "", description: "" })
  }

  const closeAssignModals = () => {
    setAssignWardenModalOpen(false)
    setHostelUsersModalOpen(false)
    setSelectedWarden(null)
    setSelectedHostelForAssign(null)
    setHostelUsers([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-bars loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`alert alert-${notification.type === 'error' ? 'error' : 'success'}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/admin" className="btn btn-ghost btn-sm gap-2 mb-4">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold">Hostel Management</h1>
          <p className="text-base-content/60 mt-2">Create, edit, and assign hostels</p>
        </div>
        <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Hostel
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <p className="text-sm font-bold text-base-content/60 uppercase">Total Hostels</p>
            <p className="text-3xl font-bold">{hostels.length}</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <p className="text-sm font-bold text-base-content/60 uppercase">Assigned Wardens</p>
            <p className="text-3xl font-bold">{hostels.filter(h => h.warden_id).length}</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <p className="text-sm font-bold text-base-content/60 uppercase">Unassigned Hostels</p>
            <p className="text-3xl font-bold">{hostels.filter(h => !h.warden_id).length}</p>
          </div>
        </div>
      </div>

      {/* Hostels Table */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">All Hostels</h2>

          {hostels.length === 0 ? (
            <div className="py-8 text-center text-base-content/60">
              No hostels found. Create one to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Rooms</th>
                    <th>Capacity</th>
                    <th>Assigned Warden</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hostels.map(hostel => (
                    <tr key={hostel.id}>
                      <td className="font-bold">{hostel.name}</td>
                      <td className="text-sm">{hostel.address || "â€”"}</td>
                      <td>
                        <div className="badge badge-ghost">{hostel.total_rooms || "â€”"}</div>
                      </td>
                      <td>{hostel.capacity || "â€”"}</td>
                      <td>
                        {hostel.warden_id ? (
                          <div className="badge badge-success">Assigned</div>
                        ) : (
                          <div className="badge badge-outline">Unassigned</div>
                        )}
                      </td>
                      <td className="flex gap-2">
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            setSelectedHostelForAssign(hostel)
                            setAssignWardenModalOpen(true)
                          }}
                          title="Assign Warden"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleEditHostel(hostel)}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-sm btn-ghost text-error"
                          onClick={() => handleDeleteHostel(hostel.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {createModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingHostel ? "Edit Hostel" : "Create New Hostel"}
            </h3>

            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Hostel Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., H1, H2, Boys Hostel..."
                  className="input input-bordered"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Address</span>
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Hostel address"
                  className="input input-bordered"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Total Rooms</span>
                  </label>
                  <input
                    type="number"
                    name="total_rooms"
                    placeholder="e.g., 50"
                    className="input input-bordered"
                    value={formData.total_rooms}
                    onChange={handleChange}
                    min="1"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Capacity</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    placeholder="Max students"
                    className="input input-bordered"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Description</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Hostel description"
                  className="textarea textarea-bordered"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="modal-action">
                <button type="button" onClick={closeCreateModal} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary gap-2" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingHostel ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={closeCreateModal} />
        </div>
      )}

      {/* Assign Warden Modal */}
      {assignWardenModalOpen && selectedHostelForAssign && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Assign Warden: {selectedHostelForAssign.name}
            </h3>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Select Warden</span>
                </label>
                <select
                  className="select select-bordered"
                  value={selectedWarden || ""}
                  onChange={(e) => setSelectedWarden(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Choose a warden...</option>
                  {users.filter(u => u.role === "warden").map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-action">
                <button
                  onClick={closeAssignModals}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignWarden}
                  className="btn btn-primary gap-2"
                  disabled={submitting || !selectedWarden}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Assign Warden
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={closeAssignModals}
          />
        </div>
      )}

      {/* Hostel Users Modal */}
      {hostelUsersModalOpen && selectedHostelForAssign && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Users in {selectedHostelForAssign.name}
            </h3>

            <div className="space-y-4">
              {hostelUsers.length === 0 ? (
                <div className="py-8 text-center text-base-content/60">
                  No users assigned to this hostel
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostelUsers.map(user => (
                        <tr key={user.id}>
                          <td className="font-bold">{user.username}</td>
                          <td className="text-sm">{user.email}</td>
                          <td>
                            <div className="badge badge-outline capitalize">{user.role}</div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-ghost text-error"
                              onClick={() => handleUnassignUser(user.id)}
                              disabled={submitting}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="alert alert-info">
                <span>â„¹ï¸ Workers are independent and assigned to specific complaints by wardens/admins, not to hostels.</span>
              </div>

              <div className="modal-action">
                <button
                  onClick={closeAssignModals}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={closeAssignModals}
          />
        </div>
      )}
    </div>
  )
}


"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import ComplaintCard from "@/components/ComplaintCard"
import {
  assignWorker,
  getAllComplaints,
  updateStatus,
} from "@/services/complaintService"

const BASE_URL = "http://localhost:8000/api/v1"

const statusFilterOptions = [
  { label: "All", value: "all" },
  { label: "Posted", value: "open" },
  { label: "Solving", value: "in_progress" },
  { label: "Solved", value: "closed" },
]

export default function WardenDashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [complaints, setComplaints] = useState([])
  const [workers, setWorkers] = useState([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [updating, setUpdating] = useState(false)

  const filteredComplaints = useMemo(() => {
    if (statusFilter === "all") return complaints
    return complaints.filter((item) => item.status === statusFilter)
  }, [complaints, statusFilter])

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token") || ""
    setToken(storedToken)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    fetchDashboardData(token)
  }, [token])

  const fetchDashboardData = async (authToken) => {
    setLoading(true)
    try {
      // Check user status first
      const userRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (userRes.data?.status !== "active") {
        router.replace("/auth/pending-approval")
        return
      }

      const complaintRes = await getAllComplaints(authToken)
      const normalizedComplaints = Array.isArray(complaintRes)
        ? complaintRes
        : Array.isArray(complaintRes?.complaints)
          ? complaintRes.complaints
          : []
      setComplaints(normalizedComplaints)

      // Backend lists users with pagination; filter workers on frontend.
      const usersRes = await axios.get(`${BASE_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      const allUsers = Array.isArray(usersRes.data?.users) ? usersRes.data.users : []
      setWorkers(allUsers.filter((user) => user.role === "worker"))
    } catch (error) {
      console.error("Failed to load warden dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignWorker = async (complaintId, workerId) => {
    if (!token) return
    setAssigning(true)
    try {
      await assignWorker(complaintId, workerId, token)
      await fetchDashboardData(token)
    } catch (error) {
      console.error("Failed to assign worker:", error)
    } finally {
      setAssigning(false)
    }
  }

  const handleUpdateStatus = async (complaintId, status) => {
    if (!token) return
    setUpdating(true)
    try {
      await updateStatus(complaintId, status, token)
      await fetchDashboardData(token)
    } catch (error) {
      console.error("Failed to update complaint status:", error)
    } finally {
      setUpdating(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <div className="alert alert-warning">
          <span>No access token found. Please log in to view the Warden Dashboard.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Warden Dashboard</h1>
          <p className="text-base-content/70 mt-1">Manage all complaints, assignments, and status updates.</p>
        </div>

        <div className="w-full md:w-64">
          <select
            className="select select-bordered w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="card bg-base-100 border border-dashed border-base-300">
          <div className="card-body items-center text-center py-12">
            <h2 className="text-xl font-semibold">No complaints found</h2>
            <p className="text-base-content/70">Try changing the status filter or check back later.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              workers={workers}
              onAssignWorker={handleAssignWorker}
              onUpdateStatus={handleUpdateStatus}
              assigning={assigning}
              updating={updating}
            />
          ))}
        </div>
      )}
    </div>
  )
}

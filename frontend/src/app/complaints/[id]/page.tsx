"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { complaintService } from "@/lib/services";
import type { Complaint, ComplaintHistory } from "@/types";
import { formatDate, capitalize, getStatusColor, getCategoryColor } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import { HiArrowLeft, HiTrash } from "react-icons/hi";

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [assignWorkerId, setAssignWorkerId] = useState("");
  const [updating, setUpdating] = useState(false);

  const complaintId = Number(id);

  useEffect(() => {
    if (!complaintId) return;
    Promise.all([
      complaintService.getOne(complaintId),
      complaintService.getHistory(complaintId),
    ])
      .then(([cRes, hRes]) => {
        setComplaint(cRes.data);
        setHistory(hRes.data);
        setStatus(cRes.data.status);
      })
      .catch(() => toast.error("Failed to load complaint"))
      .finally(() => setLoading(false));
  }, [complaintId]);

  const handleStatusUpdate = async () => {
    if (!status || status === complaint?.status) return;
    setUpdating(true);
    try {
      const res = await complaintService.update(complaintId, { status: status as Complaint["status"] });
      setComplaint(res.data);
      const hRes = await complaintService.getHistory(complaintId);
      setHistory(hRes.data);
      toast.success("Status updated");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Update failed";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!assignWorkerId) return;
    setUpdating(true);
    try {
      const res = await complaintService.assign(complaintId, Number(assignWorkerId));
      setComplaint(res.data);
      toast.success("Worker assigned");
      setAssignWorkerId("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Assign failed";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this complaint?")) return;
    try {
      await complaintService.delete(complaintId);
      toast.success("Deleted");
      router.push("/complaints");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!complaint) {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-gray-500">Complaint not found.</p>
          <Link href="/complaints" className="text-indigo-600 mt-2 inline-block">Go back</Link>
        </div>
      </ProtectedRoute>
    );
  }

  const isOwner = user?.id === complaint.created_by;
  const canManage = hasRole("admin", "warden");

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/complaints" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <HiArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Main complaint card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{complaint.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                  {capitalize(complaint.status)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(complaint.category)}`}>
                  {capitalize(complaint.category)}
                </span>
                <span className="text-xs text-gray-400">#{complaint.id}</span>
              </div>
            </div>
            {isOwner && (
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-600 p-2" title="Delete">
                <HiTrash className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-gray-700 mt-4 whitespace-pre-wrap">{complaint.description}</p>

          {complaint.image_url && (
            <div className="mt-4">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${complaint.image_url}`}
                alt="Attachment"
                className="rounded-lg max-h-64 border border-gray-200"
              />
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>Created by: User #{complaint.created_by}</span>
            {complaint.assigned_to && <span>Assigned to: Worker #{complaint.assigned_to}</span>}
            <span>Created: {formatDate(complaint.created_at)}</span>
            {complaint.updated_at && <span>Updated: {formatDate(complaint.updated_at)}</span>}
          </div>
        </div>

        {/* Actions (admin/warden) */}
        {canManage && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2 flex-1">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || status === complaint.status}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update
                </button>
              </div>
              <div className="flex gap-2 flex-1">
                <input
                  type="number"
                  value={assignWorkerId}
                  onChange={(e) => setAssignWorkerId(e.target.value)}
                  placeholder="Worker ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAssign}
                  disabled={updating || !assignWorkerId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No history yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">
                      {h.old_status && h.new_status ? (
                        <>
                          Status changed from{" "}
                          <span className="font-medium">{capitalize(h.old_status)}</span> to{" "}
                          <span className="font-medium">{capitalize(h.new_status)}</span>
                        </>
                      ) : h.comment ? (
                        h.comment
                      ) : (
                        "Complaint created"
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      By User #{h.changed_by} · {formatDate(h.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

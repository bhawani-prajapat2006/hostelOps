"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/lib/services";
import type { User, AdminStats } from "@/types";
import { capitalize } from "@/lib/utils";
import toast from "react-hot-toast";
import { HiUsers, HiClipboardList, HiOfficeBuilding, HiExclamation, HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingRoles, setPendingRoles] = useState<Record<number, string>>({});
  const pageSize = 10;
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

  useEffect(() => {
    adminService.getStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listUsers({ page, page_size: pageSize });
      setUsers(res.data.users);
      setTotalUsers(res.data.total);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRoleSelect = (userId: number, newRole: string, currentRole: string) => {
    if (newRole === currentRole) {
      setPendingRoles((prev) => { const copy = { ...prev }; delete copy[userId]; return copy; });
    } else {
      setPendingRoles((prev) => ({ ...prev, [userId]: newRole }));
    }
  };

  const handleRoleSave = async (userId: number) => {
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    try {
      await adminService.updateRole(userId, newRole);
      toast.success("Role updated");
      setPendingRoles((prev) => { const copy = { ...prev }; delete copy[userId]; return copy; });
      loadUsers();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed");
    }
  };

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: HiUsers, label: "Users", value: stats.total_users, color: "bg-blue-100 text-blue-600" },
              { icon: HiClipboardList, label: "Complaints", value: stats.total_complaints, color: "bg-indigo-100 text-indigo-600" },
              { icon: HiExclamation, label: "Open", value: stats.open_complaints, color: "bg-yellow-100 text-yellow-600" },
              { icon: HiOfficeBuilding, label: "Rooms", value: stats.total_rooms, color: "bg-green-100 text-green-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">User Management</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.filter((u) => u.id !== currentUser?.id).map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{u.username}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-3">
                        <select
                          value={pendingRoles[u.id] ?? u.role}
                          onChange={(e) => handleRoleSelect(u.id, e.target.value, u.role)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {["student", "worker", "warden", "admin"].map((r) => (
                            <option key={r} value={r}>{capitalize(r)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleRoleSave(u.id)}
                          disabled={!pendingRoles[u.id]}
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1">
                <HiChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1">
                Next <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

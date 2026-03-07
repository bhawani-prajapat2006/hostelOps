"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useState, type FormEvent } from "react";
import { authService } from "@/lib/services";
import toast from "react-hot-toast";
import { HiUserCircle } from "react-icons/hi";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [hostelName, setHostelName] = useState(user?.hostel_name || "");
  const [roomNumber, setRoomNumber] = useState(user?.room_number || "");
  const [batch, setBatch] = useState(user?.batch || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile({
        username: username || undefined,
        phone: phone || undefined,
        hostel_name: hostelName || undefined,
        room_number: roomNumber || undefined,
        batch: batch || undefined,
      });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <HiUserCircle className="w-10 h-10 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user?.username}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name</label>
                <input
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <input
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 2024"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Account Info</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900">{user?.email}</dd>
            <dt className="text-gray-500">Role</dt>
            <dd className="text-gray-900 capitalize">{user?.role}</dd>
          </dl>
        </div>
      </div>
    </ProtectedRoute>
  );
}

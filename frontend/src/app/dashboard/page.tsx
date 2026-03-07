"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { adminService, complaintService } from "@/lib/services";
import type { AdminStats, Complaint } from "@/types";
import { formatDate, capitalize, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { HiClipboardList, HiUsers, HiOfficeBuilding, HiExclamation, HiArrowRight } from "react-icons/hi";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminService.getStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <DashboardSkeleton />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard icon={HiUsers} label="Total Users" value={stats.total_users} color="bg-blue-100 text-blue-600" />
      <StatCard icon={HiClipboardList} label="Total Complaints" value={stats.total_complaints} color="bg-indigo-100 text-indigo-600" />
      <StatCard icon={HiExclamation} label="Open Complaints" value={stats.open_complaints} color="bg-yellow-100 text-yellow-600" />
      <StatCard icon={HiOfficeBuilding} label="Total Rooms" value={stats.total_rooms} color="bg-green-100 text-green-600" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-200" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-6 w-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintService
      .list({ page: 1, page_size: 5 })
      .then((r) => setComplaints(r.data.complaints))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
        <Link href="/complaints" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View all <HiArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {complaints.length === 0 ? (
        <p className="p-6 text-gray-500 text-sm text-center">No complaints yet</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {complaints.map((c) => (
            <Link key={c.id} href={`/complaints/${c.id}`} className="block px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{capitalize(c.category)} · {formatDate(c.created_at)}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                  {capitalize(c.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintService
      .getMy()
      .then((r) => setComplaints(r.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">My Complaints</h2>
        <Link href="/complaints/new" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
          + New
        </Link>
      </div>
      {complaints.length === 0 ? (
        <p className="p-6 text-gray-500 text-sm text-center">You haven&apos;t filed any complaints</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {complaints.map((c) => (
            <Link key={c.id} href={`/complaints/${c.id}`} className="block px-6 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900 text-sm">{c.title}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                  {capitalize(c.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.username} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {hasRole("admin") ? "Admin Dashboard" : hasRole("warden") ? "Warden Dashboard" : "Here's what's happening"}
          </p>
        </div>

        {hasRole("admin", "warden") && <AdminDashboard />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hasRole("admin", "warden", "worker") && <RecentComplaints />}
          <MyComplaints />
        </div>
      </div>
    </ProtectedRoute>
  );
}

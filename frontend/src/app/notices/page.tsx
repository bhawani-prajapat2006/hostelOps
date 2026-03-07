"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState, useCallback, type FormEvent } from "react";
import { noticeService } from "@/lib/services";
import type { Notice, PaginatedNotices } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { HiPlus, HiSearch, HiTrash, HiPencil, HiX, HiChevronLeft, HiChevronRight, HiStar } from "react-icons/hi";

export default function NoticesPage() {
  const { hasRole } = useAuth();
  const [data, setData] = useState<PaginatedNotices>({ notices: [], total: 0, page: 1, page_size: 10 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.ceil(data.total / data.page_size) || 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: 10 };
      if (search) params.search = search;
      const res = await noticeService.list(params);
      setData(res.data);
    } catch { /* */ }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => {
    setEditId(null);
    setTitle("");
    setContent("");
    setIsPinned(false);
    setShowForm(true);
  };

  const openEdit = (n: Notice) => {
    setEditId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setIsPinned(n.is_pinned);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await noticeService.update(editId, { title, content, is_pinned: isPinned });
        toast.success("Notice updated");
      } else {
        await noticeService.create({ title, content, is_pinned: isPinned });
        toast.success("Notice posted");
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this notice?")) return;
    try {
      await noticeService.delete(id);
      toast.success("Notice deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const canManage = hasRole("admin", "warden");

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
            <p className="text-gray-500 text-sm mt-1">Stay updated with hostel announcements</p>
          </div>
          {canManage && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              <HiPlus className="w-4 h-4" /> Post Notice
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Create/Edit Form */}
        {showForm && canManage && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{editId ? "Edit Notice" : "New Notice"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Notice title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required value={content} onChange={(e) => setContent(e.target.value)} rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Write your notice..."
                />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">Pin this notice</span>
              </label>
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving..." : editId ? "Update" : "Post Notice"}
              </button>
            </form>
          </div>
        )}

        {/* Notices list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : data.notices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No notices found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.notices.map((notice: Notice) => (
              <div key={notice.id} className={`bg-white rounded-xl border p-6 ${notice.is_pinned ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {notice.is_pinned && <HiStar className="w-4 h-4 text-indigo-500" />}
                      <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                    </div>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap text-sm">{notice.content}</p>
                    <p className="text-xs text-gray-400 mt-3">
                      Posted by User #{notice.posted_by} · {formatDate(notice.created_at)}
                      {notice.updated_at && notice.updated_at !== notice.created_at && ` · Updated ${formatDate(notice.updated_at)}`}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 ml-4 shrink-0">
                      <button onClick={() => openEdit(notice)} className="p-1.5 text-gray-400 hover:text-indigo-600">
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(notice.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
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

"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState, useCallback, type FormEvent } from "react";
import { roomService } from "@/lib/services";
import type { Room, PaginatedRooms } from "@/types";
import toast from "react-hot-toast";
import { HiPlus, HiTrash, HiUserAdd, HiUserRemove, HiChevronLeft, HiChevronRight, HiX } from "react-icons/hi";

export default function RoomsPage() {
  const [data, setData] = useState<PaginatedRooms>({ rooms: [], total: 0, page: 1, page_size: 10 });
  const [page, setPage] = useState(1);
  const [hostelFilter, setHostelFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [assignStudentId, setAssignStudentId] = useState("");

  // Create form
  const [roomNumber, setRoomNumber] = useState("");
  const [hostelName, setHostelName] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [floor, setFloor] = useState(1);
  const [creating, setCreating] = useState(false);

  const totalPages = Math.ceil(data.total / data.page_size) || 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, page_size: 10 };
      if (hostelFilter) params.hostel_name = hostelFilter;
      const res = await roomService.list(params);
      setData(res.data);
    } catch { /* */ }
    setLoading(false);
  }, [page, hostelFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [hostelFilter]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await roomService.create({ room_number: roomNumber, hostel_name: hostelName, capacity, floor });
      toast.success("Room created");
      setShowCreate(false);
      setRoomNumber("");
      setHostelName("");
      setCapacity(2);
      setFloor(1);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this room?")) return;
    try {
      await roomService.delete(id);
      toast.success("Room deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const handleAssign = async (roomId: number) => {
    if (!assignStudentId) return;
    try {
      await roomService.assign(roomId, Number(assignStudentId));
      toast.success("Student assigned");
      setShowAssign(null);
      setAssignStudentId("");
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed");
    }
  };

  const handleUnassign = async (roomId: number, studentId: number) => {
    try {
      await roomService.unassign(roomId, studentId);
      toast.success("Student removed");
      load();
    } catch { toast.error("Failed"); }
  };

  return (
    <ProtectedRoute roles={["admin", "warden"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
            <p className="text-gray-500 text-sm mt-1">{data.total} rooms</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
          >
            <HiPlus className="w-4 h-4" /> Add Room
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Create Room</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input
                  required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="A-101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name</label>
                <input
                  required value={hostelName} onChange={(e) => setHostelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Hostel A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number" min={1} required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                <input
                  type="number" min={0} value={floor} onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <button type="submit" disabled={creating}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="mb-4">
          <input
            type="text" value={hostelFilter} onChange={(e) => setHostelFilter(e.target.value)}
            placeholder="Filter by hostel name..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          />
        </div>

        {/* Rooms grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : data.rooms.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No rooms found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.rooms.map((room: Room) => (
              <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{room.room_number}</h3>
                    <p className="text-sm text-gray-500">{room.hostel_name} · Floor {room.floor ?? "—"}</p>
                  </div>
                  <button onClick={() => handleDelete(room.id)} className="text-gray-400 hover:text-red-600">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${room.occupants >= room.capacity ? "bg-red-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min((room.occupants / room.capacity) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{room.occupants}/{room.capacity}</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${room.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {room.is_available ? "Available" : "Full"}
                  </span>

                  {showAssign === room.id ? (
                    <div className="flex gap-1 flex-1">
                      <input
                        type="number"
                        value={assignStudentId}
                        onChange={(e) => setAssignStudentId(e.target.value)}
                        placeholder="Student ID"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button onClick={() => handleAssign(room.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Go</button>
                      <button onClick={() => setShowAssign(null)}
                        className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300">×</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setShowAssign(room.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
                        <HiUserAdd className="w-3.5 h-3.5" /> Assign
                      </button>
                      {room.occupants > 0 && (
                        <button onClick={() => handleUnassign(room.id, 0)}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-0.5">
                          <HiUserRemove className="w-3.5 h-3.5" /> Unassign
                        </button>
                      )}
                    </>
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

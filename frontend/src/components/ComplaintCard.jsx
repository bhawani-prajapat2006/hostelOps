"use client"

import Link from "next/link"

const statusLabelMap = {
  open: "Posted",
  in_progress: "Solving",
  closed: "Solved",
}

const statusBadgeClassMap = {
  open: "badge-warning",
  in_progress: "badge-info",
  closed: "badge-success",
}

export default function ComplaintCard({
  complaint,
  workers = [],
  onAssignWorker,
  onUpdateStatus,
  onReviewResolution,
  assigning,
  updating,
}) {
  const nextStatus =
    complaint.status === "open"
      ? "in_progress"
      : complaint.status === "in_progress"
        ? "closed"
        : null

  const nextStatusLabel =
    complaint.status === "open"
      ? "Move to Solving"
      : complaint.status === "in_progress"
        ? "Move to Solved"
        : "Solved"

  const inReviewQueue = Boolean(complaint.awaiting_warden_review)

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="card-title text-lg">{complaint.title}</h3>
            <p className="text-sm text-base-content/70 mt-1">{complaint.description}</p>
          </div>
          <div className={`badge ${statusBadgeClassMap[complaint.status] || "badge-ghost"}`}>
            {statusLabelMap[complaint.status] || complaint.status}
          </div>
        </div>

        <div className="text-sm text-base-content/70">
          <span className="font-medium">Assigned Worker: </span>
          {complaint.assigned_to ? `Worker #${complaint.assigned_to}` : "Not assigned"}
        </div>

        {inReviewQueue && (
          <div className="alert alert-info py-2 text-sm">
            <span>Worker submitted completion proof. Please review and approve or send back.</span>
          </div>
        )}

        {complaint.image_after_solved && (
          <div className="space-y-2">
            <p className="text-sm font-medium">After-Fix Image</p>
            <img
              src={complaint.image_after_solved}
              alt="After resolved"
              className="w-full md:w-72 rounded-lg border border-base-300"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <select
            className="select select-bordered w-full"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return
              onAssignWorker(complaint.id, e.target.value)
              e.target.value = ""
            }}
            disabled={assigning}
          >
            <option value="" disabled>
              Assign worker
            </option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.username} ({worker.email})
              </option>
            ))}
          </select>

          {inReviewQueue ? (
            <div className="flex gap-2 md:col-span-2">
              <button
                className="btn btn-success flex-1"
                onClick={() => onReviewResolution && onReviewResolution(complaint.id, true)}
                disabled={updating}
              >
                Approve & Close
              </button>
              <button
                className="btn btn-warning flex-1"
                onClick={() => onReviewResolution && onReviewResolution(complaint.id, false)}
                disabled={updating}
              >
                Send Back
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => nextStatus && onUpdateStatus(complaint.id, nextStatus)}
              disabled={!nextStatus || updating}
            >
              {nextStatusLabel}
            </button>
          )}

          <Link href={`/complaints/${complaint.id}`} className="btn btn-outline">
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

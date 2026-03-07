/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseApiError(err: unknown, fallback = "Something went wrong"): string {
  const resp = (err as any)?.response?.data;
  if (!resp?.detail) return fallback;
  if (typeof resp.detail === "string") return resp.detail;
  if (Array.isArray(resp.detail)) {
    return resp.detail.map((e: any) => e.msg?.replace(/^Value error, /, "") || "").filter(Boolean).join(". ") || fallback;
  }
  return fallback;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "open": return "bg-yellow-100 text-yellow-800";
    case "in_progress": return "bg-blue-100 text-blue-800";
    case "closed": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    plumbing: "bg-cyan-100 text-cyan-800",
    electrical: "bg-amber-100 text-amber-800",
    cleanliness: "bg-emerald-100 text-emerald-800",
    furniture: "bg-orange-100 text-orange-800",
    network: "bg-purple-100 text-purple-800",
    other: "bg-gray-100 text-gray-800",
  };
  return colors[category] || colors.other;
}

import React from "react";
import { ApplicationStatus, DocumentStatus, EvidenceStatus } from "@/types";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus | string }) {
  const styles: Record<string, string> = {
    Received: "bg-blue-50 text-blue-700 border-blue-200/80",
    Processing: "bg-indigo-50 text-indigo-700 border-indigo-200/80 animate-pulse",
    "Under Review": "bg-purple-50 text-purple-700 border-purple-200/80",
    Shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-xs",
    Interview: "bg-amber-50 text-amber-800 border-amber-300 font-semibold shadow-xs",
    "On Hold": "bg-slate-100 text-slate-700 border-slate-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
    Hired: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold shadow-xs",
    Withdrawn: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const style = styles[status] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border backdrop-blur-md transition-all ${style}`}
    >
      {status}
    </span>
  );
}

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus | string }) {
  const styles: Record<string, { bg: string; icon: string }> = {
    Evidenced: { bg: "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-xs", icon: "✓" },
    "Partially Evidenced": { bg: "bg-amber-50 text-amber-800 border-amber-300", icon: "≈" },
    "Not Found": { bg: "bg-rose-50 text-rose-700 border-rose-300", icon: "✕" },
    Unclear: { bg: "bg-slate-100 text-slate-700 border-slate-200", icon: "?" },
  };

  const current = styles[status] || { bg: "bg-slate-100 text-slate-700 border-slate-200", icon: "•" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-md ${current.bg}`}
    >
      <span className="font-bold">{current.icon}</span>
      <span>{status}</span>
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus | string }) {
  const styles: Record<string, string> = {
    Uploaded: "bg-slate-100 text-slate-700 border-slate-200",
    Pending: "bg-amber-50 text-amber-800 border-amber-200",
    Processing: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
    Failed: "bg-rose-50 text-rose-700 border-rose-200",
    Quarantined: "bg-red-50 text-red-700 border-red-300 font-bold",
    "Requires Manual Review": "bg-orange-50 text-orange-800 border-orange-200",
  };

  const style = styles[status] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs border backdrop-blur-md font-medium ${style}`}
    >
      {status}
    </span>
  );
}

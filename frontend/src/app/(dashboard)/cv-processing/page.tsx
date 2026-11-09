"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Application } from "@/types";
import { DocumentStatusBadge } from "@/components/StatusBadge";
import { FileScan, RefreshCw, CheckCircle2, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CvProcessingPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.listApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      setReprocessingId(docId);
      await api.reprocessDocument(docId);
      await loadDocuments();
    } catch (err) {
      console.error(err);
    } finally {
      setReprocessingId(null);
    }
  };

  // Extract all documents across applications
  const allDocs: { doc: any; app: Application }[] = [];
  applications.forEach((app) => {
    app.documents?.forEach((d) => {
      allDocs.push({ doc: d, app });
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CV Processing Engine</h1>
          <p className="text-sm text-slate-400">
            Real-time document ingestion queue, Celery workers, and Gemini extraction status
          </p>
        </div>
        <button
          onClick={loadDocuments}
          className="inline-flex items-center gap-2 px-3.5 py-2 glass-panel text-slate-300 rounded-xl text-xs font-semibold hover:text-white hover:bg-white/10 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 glass-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Completed Documents</div>
            <div className="text-2xl font-bold text-white">
              {allDocs.filter((d) => d.doc.status === "Completed").length}
            </div>
          </div>
        </div>

        <div className="p-5 glass-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <FileScan className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Pending or In Queue</div>
            <div className="text-2xl font-bold text-white">
              {allDocs.filter((d) => d.doc.status === "Pending" || d.doc.status === "Processing").length}
            </div>
          </div>
        </div>

        <div className="p-5 glass-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Failed / Quarantined</div>
            <div className="text-2xl font-bold text-white">
              {allDocs.filter((d) => d.doc.status === "Failed" || d.doc.status === "Quarantined").length}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Ingested Documents</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 text-xs uppercase border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-semibold">Document File</th>
                <th className="px-6 py-3 font-semibold">Candidate</th>
                <th className="px-6 py-3 font-semibold">Storage Provider</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Uploaded</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {allDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                allDocs.map(({ doc, app }) => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <div className="font-medium text-white text-xs">{doc.file_name}</div>
                          <div className="text-[11px] text-slate-400">
                            {(doc.file_size_bytes / 1024).toFixed(1)} KB • {doc.file_type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-white text-xs">{app.candidate?.full_name}</div>
                      <div className="text-[11px] text-slate-400">{app.candidate?.email}</div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-300">
                      {doc.storage_provider}
                    </td>

                    <td className="px-6 py-4">
                      <DocumentStatusBadge status={doc.status} />
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReprocess(doc.id)}
                          disabled={reprocessingId === doc.id}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {reprocessingId === doc.id ? "Queuing..." : "Reprocess"}
                        </button>
                        <Link
                          href={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

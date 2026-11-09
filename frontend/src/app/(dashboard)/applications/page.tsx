"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Application, ApplicationStatus } from "@/types";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import { Search, Filter, ArrowRight, FileText, CheckCircle2 } from "lucide-react";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    loadApplications();
  }, [search, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.listApplications(params);
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statuses: ApplicationStatus[] = [
    "Received",
    "Processing",
    "Under Review",
    "Shortlisted",
    "Interview",
    "On Hold",
    "Rejected",
    "Hired",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Applications Pipeline</h1>
          <p className="text-sm text-slate-500">Track candidate evaluations, recruiter reviews, and hiring stages</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 glass-input rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
          >
            <option value="">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400">Loading pipeline applications...</div>
      ) : applications.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900">No applications match your filter</h3>
          <p className="text-sm text-slate-500 mt-1">Applications received from portals or emails will appear here.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Candidate</th>
                  <th className="px-6 py-3.5 font-bold">Target Vacancy</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">AI Evidence Match</th>
                  <th className="px-6 py-3.5 font-bold">Recruiter Review</th>
                  <th className="px-6 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-slate-700">
                {applications.map((app) => {
                  const assessment = app.latest_assessment;
                  const isReviewed = assessment?.is_reviewed_by_recruiter === "true";
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {app.candidate?.full_name || "Candidate"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{app.candidate?.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium">{app.job_title}</div>
                        <div className="text-[11px] text-slate-500">{app.source}</div>
                      </td>

                      <td className="px-6 py-4">
                        <ApplicationStatusBadge status={app.status} />
                      </td>

                      <td className="px-6 py-4">
                        {assessment ? (
                          <div className="text-xs space-y-0.5">
                            <span className="font-bold text-blue-700">
                              {assessment.essential_requirements_met} Essential
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {assessment.preferred_requirements_met} Preferred
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Processing AI...</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 backdrop-blur-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">AI Draft</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-all shadow-xs"
                        >
                          <span>Review Dossier</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

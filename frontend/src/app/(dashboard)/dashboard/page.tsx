"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import {
  Briefcase,
  Users,
  FileText,
  Clock,
  UserCheck,
  CheckCircle2,
  FileScan,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="text-sm font-medium text-slate-600">Loading recruitment intelligence...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 backdrop-blur-xl">
        <div className="font-bold text-base mb-1">Failed to connect to backend API</div>
        <div className="text-sm text-rose-600">{error}</div>
      </div>
    );
  }

  const kpis = [
    { label: "Active Jobs", value: stats.active_jobs, total: stats.total_jobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Talent Pool", value: stats.total_candidates, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
    { label: "Applications", value: stats.total_applications, icon: FileText, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
    { label: "Under Review", value: stats.applications_under_review, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { label: "Shortlisted", value: stats.shortlisted_candidates, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Hired", value: stats.hired_candidates, icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50 border-teal-200" },
  ];

  return (
    <div className="space-y-8">
      {/* Top Glass Banner */}
      <div className="relative rounded-3xl p-8 sm:p-10 border border-white/80 overflow-hidden shadow-sm backdrop-blur-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold mb-4 border border-blue-200 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Recruiter Engine v1.0 • Gemini 1.5 Flash</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Recruitment Command Center
          </h1>
          <p className="mt-2.5 text-slate-600 text-sm leading-relaxed">
            Multi-tenant CV ingestion, factual extraction, evidence-based criteria matching, and human-in-the-loop candidate reviews.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/jobs/new"
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 border border-blue-400/30"
            >
              + Create New Vacancy
            </Link>
            <Link
              href="/cv-processing"
              className="px-4 py-2.5 bg-white/80 hover:bg-white rounded-xl text-xs font-semibold text-slate-700 border border-slate-200/80 backdrop-blur-md transition-all shadow-xs"
            >
              Upload CV Document
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards in Glass */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl glass-card transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-slate-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} border flex items-center justify-center shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</div>
              {kpi.total !== undefined && (
                <div className="text-[10px] text-slate-400 mt-1 font-mono">out of {kpi.total} total</div>
              )}
            </div>
          );
        })}
      </div>

      {/* CV Processing Status Pipeline */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileScan className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">CV Document Ingestion Pipeline</h2>
              <p className="text-xs text-slate-500">Asynchronous Celery extraction and Pydantic validation</p>
            </div>
          </div>
          <Link
            href="/cv-processing"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition-colors"
          >
            <span>View Processing Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur-md">
            <div className="text-xs font-medium text-slate-500">CVs Received</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.cvs_received}</div>
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 backdrop-blur-md">
            <div className="text-xs font-semibold text-emerald-700">AI Processed & Validated</div>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1">{stats.cvs_processed}</div>
          </div>
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 backdrop-blur-md">
            <div className="text-xs font-semibold text-amber-800">Pending in Queue</div>
            <div className="text-2xl font-extrabold text-amber-900 mt-1">{stats.cvs_pending}</div>
          </div>
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 backdrop-blur-md">
            <div className="text-xs font-semibold text-rose-700">Requires Manual Review</div>
            <div className="text-2xl font-extrabold text-rose-800 mt-1">{stats.cvs_failed}</div>
          </div>
        </div>
      </div>

      {/* Recent Applications Glass Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Recent Candidate Submissions</h2>
            <p className="text-xs text-slate-500">Latest applicants evaluated by the evidence matching engine</p>
          </div>
          <Link
            href="/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View Full Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5 font-bold">Candidate</th>
                <th className="px-6 py-3.5 font-bold">Target Vacancy</th>
                <th className="px-6 py-3.5 font-bold">Status</th>
                <th className="px-6 py-3.5 font-bold">Submitted Date</th>
                <th className="px-6 py-3.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-slate-700">
              {stats.recent_applications?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No applications submitted yet.
                  </td>
                </tr>
              ) : (
                stats.recent_applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{app.candidate_name}</div>
                      <div className="text-xs text-slate-500 font-mono">{app.candidate_email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{app.job_title}</td>
                    <td className="px-6 py-4">
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(app.created_at).toLocaleDateString()}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

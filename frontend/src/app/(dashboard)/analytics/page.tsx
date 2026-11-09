"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  Briefcase,
  FileCheck,
  FileX,
  Clock,
  Sparkles,
  ArrowUpRight,
  Filter,
} from "lucide-react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading recruitment reports...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-slate-400">Failed to load analytics data.</div>;
  }

  const statusDistribution = stats.status_distribution || {};
  const totalApps = stats.total_applications || 1;

  // Pipeline funnel steps
  const funnelSteps = [
    { label: "Received", count: statusDistribution["Received"] || 0, color: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" },
    { label: "Under Review", count: statusDistribution["Under Review"] || 0, color: "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]" },
    { label: "Shortlisted", count: statusDistribution["Shortlisted"] || 0, color: "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" },
    { label: "Interview", count: statusDistribution["Interview"] || 0, color: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" },
    { label: "Hired", count: statusDistribution["Hired"] || 0, color: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Recruitment Analytics</h1>
          <p className="text-sm text-slate-400">
            Pipeline velocity, AI processing throughput, and hiring conversion metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 glass-input rounded-xl text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:bg-slate-900 [&>option]:text-white"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 glass-card">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
            <span>Overall Conversion</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {((stats.hired_candidates / Math.max(1, stats.total_applications)) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Application to Hire rate</div>
        </div>

        <div className="p-5 glass-card">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
            <span>Shortlist Ratio</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {((stats.shortlisted_candidates / Math.max(1, stats.total_applications)) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.shortlisted_candidates} candidates shortlisted
          </div>
        </div>

        <div className="p-5 glass-card">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
            <span>AI Parsing Success</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {((stats.cvs_processed / Math.max(1, stats.cvs_received)) * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.cvs_processed} of {stats.cvs_received} CVs validated
          </div>
        </div>

        <div className="p-5 glass-card">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2">
            <span>Review Backlog</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.applications_under_review}</div>
          <div className="text-[11px] text-slate-400 mt-1">Applications awaiting decision</div>
        </div>
      </div>

      {/* Recruitment Pipeline Funnel */}
      <div className="glass-panel p-6 space-y-5">
        <div>
          <h2 className="font-bold text-white text-base">Hiring Pipeline Funnel</h2>
          <p className="text-xs text-slate-400">Progression across key recruitment stages</p>
        </div>

        <div className="space-y-4">
          {funnelSteps.map((step) => {
            const pct = Math.max(8, Math.min(100, (step.count / Math.max(1, stats.total_applications)) * 100));
            return (
              <div key={step.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{step.label}</span>
                  <span className="text-slate-400 font-mono">
                    {step.count} ({((step.count / Math.max(1, stats.total_applications)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${step.color}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown by Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="font-bold text-blue-400 text-xs uppercase tracking-wider">
            Application Status Distribution
          </h2>
          <div className="space-y-2">
            {Object.entries(statusDistribution).map(([st, count]: any) => (
              <div key={st} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="font-medium text-slate-200">{st}</span>
                <span className="font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI & Automation Health */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-blue-400 text-xs uppercase tracking-wider">
              AI Engine & Workflow Health
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <div className="font-semibold text-white">Active AI Model</div>
              <div className="text-slate-400">Google Gemini 1.5 Flash (Evidence Citing & Summaries)</div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <div className="font-semibold text-white">Task Queue & Workers</div>
              <div className="text-slate-400">Celery 5.6 + Redis Broker (Async non-blocking CV extraction)</div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <div className="font-semibold text-white">Workflow Automation</div>
              <div className="text-slate-400">n8n Event Dispatching (/webhook/hireflow/*)</div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <div className="font-semibold text-emerald-300">Tenant Data Boundary</div>
              <div className="text-emerald-400">Strict Logical Scoping & Audit Logging Enforced</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

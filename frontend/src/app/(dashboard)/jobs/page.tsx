"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Job } from "@/types";
import { Briefcase, Plus, MapPin, Users, ExternalLink, ArrowRight, Search } from "lucide-react";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadJobs();
  }, [search]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await api.listJobs(search ? { search } : {});
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Paused":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Vacancies</h1>
          <p className="text-sm text-slate-500">Manage active openings and requirement criteria</p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20 border border-blue-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Create Vacancy</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs by title or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading vacancies...</div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900">No vacancies found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">Create your first job with Essential and Preferred requirements.</p>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 border border-blue-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create Vacancy</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="glass-card p-5 flex flex-col justify-between group transition-all duration-300"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md ${getStatusBadge(job.status)}`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{job.employment_type}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1 group-hover:text-blue-700 transition-colors">
                  {job.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span>{job.department || "General"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {job.location || "Remote"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 mb-4 space-y-1">
                  <div className="font-semibold text-slate-800">Criteria Configured:</div>
                  <div className="text-[11px] text-slate-500">
                    {job.requirements?.filter((r) => r.category === "Essential").length || 0} Essential •{" "}
                    {job.requirements?.filter((r) => r.category === "Preferred").length || 0} Preferred
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-900">{job.application_count}</span>
                  <span>applications</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/portal/technova/jobs/${job.id}`}
                    target="_blank"
                    title="View Public Application Page"
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

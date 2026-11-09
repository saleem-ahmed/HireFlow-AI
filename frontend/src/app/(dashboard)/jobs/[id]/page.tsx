"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Job, Application } from "@/types";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, MapPin, Users, ExternalLink, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const jobId = params.id as string;

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const [jobData, appsData] = await Promise.all([
        api.getJob(jobId),
        api.listApplications({ job_id: jobId }),
      ]);
      setJob(jobData);
      setApplications(appsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!job) return;
    const nextStatus = job.status === "Published" ? "Paused" : "Published";
    try {
      await api.updateJob(job.id, { status: nextStatus });
      setJob({ ...job, status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading vacancy details...</div>;
  }

  if (!job) {
    return <div className="p-8 text-center text-slate-400">Vacancy not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/jobs"
          className="p-2.5 rounded-xl glass-panel text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                job.status === "Published"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {job.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>{job.department}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {job.location}
            </span>
            <span>•</span>
            <span>{job.employment_type}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Criteria */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="font-semibold text-blue-700 text-xs uppercase tracking-wider">
              Role Overview
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>

            {job.responsibilities && (
              <div className="pt-4 border-t border-slate-200/80">
                <h3 className="text-xs font-semibold text-slate-800 uppercase mb-2">
                  Key Responsibilities
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{job.responsibilities}</p>
              </div>
            )}
          </div>

          {/* AI Matching Criteria */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="font-semibold text-blue-700 text-xs uppercase tracking-wider">
                Configured AI Assessment Criteria
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evidence will be cited from candidate CVs against these requirements.
              </p>
            </div>

            <div className="divide-y divide-slate-200/80">
              {job.requirements?.map((req) => (
                <div key={req.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-900">{req.title}</div>
                    {req.description && (
                      <div className="text-xs text-slate-500">{req.description}</div>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 backdrop-blur-md border ${
                      req.category === "Essential"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}
                  >
                    {req.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Job Applications */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Applicants ({applications.length})</h2>
                <p className="text-xs text-slate-500">Submissions received for this role</p>
              </div>
            </div>

            <div className="divide-y divide-slate-200/60">
              {applications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No applications received yet for this vacancy.
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">
                        {app.candidate?.full_name || "Applicant"}
                      </div>
                      <div className="text-xs text-slate-500">{app.candidate?.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ApplicationStatusBadge status={app.status} />
                      <Link
                        href={`/applications/${app.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors shadow-xs"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Portal Link
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Candidates can submit their applications and upload CVs through the public portal.
            </p>
            <Link
              href={`/portal/technova/jobs/${job.id}`}
              target="_blank"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/20 border border-blue-400/30"
            >
              <span>Open Public Application Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleStatusToggle}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all backdrop-blur-md border ${
                job.status === "Published"
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              {job.status === "Published" ? "Pause Vacancy" : "Publish Vacancy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

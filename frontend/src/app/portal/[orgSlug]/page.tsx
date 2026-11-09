"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Job } from "@/types";
import { Briefcase, MapPin, Sparkles, ArrowRight, Building2 } from "lucide-react";

export default function PublicCandidatePortalPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortalJobs();
  }, [orgSlug]);

  const loadPortalJobs = async () => {
    try {
      setLoading(true);
      const data = await api.getPortalJobs(orgSlug);
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Light pastel ambient orbs */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 bg-blue-200/40 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 w-96 h-96 bg-purple-200/30 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 border border-blue-400/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight capitalize text-base">
                {orgSlug.replace(/-/g, " ")} Careers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Powered by</span>
            <span className="font-bold text-blue-600">HireFlow AI</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="py-16 px-6 relative z-10 text-center space-y-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Join Our Mission</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Explore Open Career Opportunities
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Apply with your CV for fast, transparent, and evidence-based recruitment evaluations.
        </p>
      </div>

      {/* Job Vacancies */}
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <h2 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">
          Open Positions ({jobs.length})
        </h2>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading positions...</div>
        ) : jobs.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500">
            No open roles currently posted. Please check back soon.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-300/60 transition-all duration-300"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {job.title}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium">
                      {job.employment_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 pt-1 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <Link
                  href={`/portal/${orgSlug}/jobs/${job.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shrink-0 shadow-lg shadow-blue-500/20 border border-blue-400/30"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

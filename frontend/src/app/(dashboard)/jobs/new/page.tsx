"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Sparkles } from "lucide-react";

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Remote / San Francisco");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [experienceLevel, setExperienceLevel] = useState("Senior");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [status, setStatus] = useState("Published");

  const [requirements, setRequirements] = useState([
    { title: "5+ years software development experience with Python and FastAPI", category: "Essential", description: "" },
    { title: "Proficiency in modern TypeScript and React/Next.js architectures", category: "Essential", description: "" },
    { title: "Experience with PostgreSQL schema design and indexing", category: "Essential", description: "" },
    { title: "Familiarity with Celery and Redis asynchronous processing", category: "Preferred", description: "" },
  ]);

  const addRequirement = () => {
    setRequirements([
      ...requirements,
      { title: "", category: "Essential", description: "" },
    ]);
  };

  const removeRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const updateRequirement = (idx: number, field: string, value: string) => {
    const updated = [...requirements];
    (updated[idx] as any)[field] = value;
    setRequirements(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const validReqs = requirements.filter((r) => r.title.trim().length > 0);
      await api.createJob({
        title,
        department,
        location,
        employment_type: employmentType,
        experience_level: experienceLevel,
        description,
        responsibilities,
        qualifications,
        status,
        requirements: validReqs,
      });
      router.push("/jobs");
    } catch (err: any) {
      setError(err.message || "Failed to create vacancy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/jobs"
          className="p-2.5 rounded-xl glass-panel text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Job Vacancy</h1>
          <p className="text-xs text-slate-500">Define role parameters and criteria for AI evidence matching</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm backdrop-blur-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lead Full-Stack Architect"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote / New York"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
              >
                <option value="Published">Published (Live on Portal)</option>
                <option value="Draft">Draft (Internal)</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Job Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the mission, scope, and technical context for this opportunity..."
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
            />
          </div>
        </div>

        {/* AI Requirement Assessment Criteria */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">AI Assessment Requirements</h2>
                <p className="text-xs text-slate-500">
                  Gemini compares applicant CV evidence against each requirement item.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={addRequirement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Criteria</span>
            </button>
          </div>

          <div className="space-y-3">
            {requirements.map((req, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur-md shadow-xs"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Requirement (e.g. 3+ years experience with Kubernetes clusters)"
                      value={req.title}
                      onChange={(e) => updateRequirement(idx, "title", e.target.value)}
                      className="flex-1 px-3 py-2 glass-input rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
                    />
                    <select
                      value={req.category}
                      onChange={(e) => updateRequirement(idx, "category", e.target.value)}
                      className="px-2.5 py-2 glass-input rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
                    >
                      <option value="Essential">Essential</option>
                      <option value="Preferred">Preferred</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeRequirement(idx)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/jobs"
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20 border border-blue-400/30 disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Create & Publish Job"}
          </button>
        </div>
      </form>
    </div>
  );
}

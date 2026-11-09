"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Job } from "@/types";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, FileText, Sparkles, Building2 } from "lucide-react";

export default function PublicJobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJob();
  }, [orgSlug, jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = await api.getPortalJob(orgSlug, jobId);
      setJob(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please attach your CV document (PDF, DOCX, or TXT).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("job_id", jobId);
      formData.append("full_name", fullName);
      formData.append("email", email);
      if (phone) formData.append("phone", phone);
      if (coverLetter) formData.append("cover_letter", coverLetter);
      formData.append("file", file);

      await api.submitPortalApplication(orgSlug, formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-500">Loading vacancy details...</div>;
  }

  if (!job) {
    return <div className="p-8 text-center text-slate-500">Vacancy not found.</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Light pastel ambient orbs */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 bg-blue-200/40 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 w-96 h-96 bg-purple-200/30 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href={`/portal/${orgSlug}`}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Open Positions</span>
          </Link>
          <div className="text-xs text-slate-500 font-medium">Powered by <span className="text-blue-600 font-semibold">HireFlow AI</span></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-10 space-y-8 relative z-10">
        {/* Job Header */}
        <div className="glass-panel p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {job.department}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{job.location}</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{job.employment_type}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {job.title}
          </h1>

          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-2">
            {job.description}
          </p>

          {job.responsibilities && (
            <div className="pt-4 border-t border-slate-200/80">
              <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                Key Responsibilities
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">{job.responsibilities}</p>
            </div>
          )}

          {job.requirements?.length > 0 && (
            <div className="pt-4 border-t border-slate-200/80">
              <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                Requirements Evaluated by AI
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {job.requirements.map((r) => (
                  <li key={r.id}>
                    <span className="font-semibold text-slate-800">{r.title}</span>{" "}
                    <span className="text-[10px] text-slate-400">({r.category})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Application Form or Confirmation */}
        {submitted ? (
          <div className="glass-panel p-8 sm:p-12 text-center space-y-4 border border-emerald-200 bg-emerald-50/60">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Application Submitted Successfully!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for applying for the <span className="font-semibold text-slate-800">{job.title}</span> role.
              Our recruitment team and AI document processing pipeline have received your CV.
            </p>
            <div className="pt-4">
              <Link
                href={`/portal/${orgSlug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 border border-blue-400/30"
              >
                Return to Careers Portal
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Submit Your Application
              </h2>
              <p className="text-xs text-slate-500">
                Please attach your CV document in PDF, DOCX, or TXT format.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full px-3.5 py-2.5 glass-input rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2.5 glass-input rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* CV File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Attach CV / Resume (PDF, DOCX, TXT - max 10MB) *
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400/60 transition-colors bg-slate-50/80">
                  <input
                    type="file"
                    required
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer block space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-md">
                      <Upload className="w-5 h-5" />
                    </div>
                    {file ? (
                      <div className="text-xs font-semibold text-blue-700 flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        <span>{file.name}</span>
                        <span className="text-slate-500 font-normal">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-semibold text-slate-800">
                          Click to browse and upload your CV document
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Supported formats: PDF, DOCX, TXT (Maximum file size: 10MB)
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cover Letter / Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share any context regarding your background, availability, or motivation..."
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Privacy & Consent: </span>
                By submitting this application, you consent to the processing of your CV information
                by HireFlow AI for recruitment assessment purposes. Final decisions are made by human recruiters.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 border border-blue-400/30 disabled:opacity-50"
              >
                {submitting ? "Processing & Uploading CV..." : "Submit Application"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

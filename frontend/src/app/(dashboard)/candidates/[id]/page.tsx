"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Candidate } from "@/types";
import { ArrowLeft, Save, Mail, Phone, MapPin, Globe, CheckCircle2, User, Briefcase, GraduationCap, Wrench } from "lucide-react";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [professionalSummary, setProfessionalSummary] = useState("");

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      const data = await api.getCandidate(candidateId);
      setCandidate(data);
      setFullName(data.full_name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setLocation(data.location || "");
      setLinkedinUrl(data.linkedin_url || "");
      setPortfolioUrl(data.portfolio_url || "");
      setProfessionalSummary(data.professional_summary || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateCandidate(candidateId, {
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        professional_summary: professionalSummary,
      });
      setCandidate(updated);
      setMessage("Profile corrections saved successfully to audit log.");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading candidate profile...</div>;
  }

  if (!candidate) {
    return <div className="p-8 text-center text-slate-500">Candidate not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/candidates"
          className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white transition-colors backdrop-blur-xl"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{candidate.full_name}</h1>
          <p className="text-xs text-slate-500">Recruiter profile review and manual corrections (FR-026)</p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Profile */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Identity & Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Portfolio URL</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Professional Summary</label>
            <textarea
              rows={4}
              value={professionalSummary}
              onChange={(e) => setProfessionalSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Skills Tag Cloud */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="glass-panel p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Extracted Skills & Competencies ({candidate.skills.length})
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {candidate.skills.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-white/80 border border-slate-200 text-slate-700 text-xs font-medium"
                >
                  {sk.skill_name}
                  {sk.years_experience && (
                    <span className="ml-1 text-[10px] text-slate-400">({sk.years_experience} yrs)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {candidate.experiences && candidate.experiences.length > 0 && (
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Experience History
              </h2>
            </div>
            <div className="space-y-4">
              {candidate.experiences.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/60 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900 text-sm">{exp.role}</div>
                    <div className="text-xs text-slate-500">
                      {exp.start_date || "Past"} – {exp.is_current ? "Present" : exp.end_date || "Past"}
                    </div>
                  </div>
                  <div className="text-xs text-blue-700 font-medium">{exp.company}</div>
                  {exp.description && (
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {candidate.education && candidate.education.length > 0 && (
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Education
              </h2>
            </div>
            <div className="space-y-3">
              {candidate.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/60 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900 text-sm">{edu.institution}</div>
                    <div className="text-xs text-slate-500">
                      {edu.start_year || ""} – {edu.end_year || ""}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/candidates"
            className="px-4 py-2 border border-slate-200/80 text-slate-600 rounded-xl text-sm font-semibold hover:bg-white/80 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 border border-blue-400/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Corrections"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

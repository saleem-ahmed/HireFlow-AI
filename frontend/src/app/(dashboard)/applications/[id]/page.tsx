"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Application, ApplicationStatus, EvidenceStatus } from "@/types";
import { ApplicationStatusBadge, EvidenceStatusBadge, DocumentStatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Sparkles,
  Download,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Clock,
  UserCheck,
  Edit3,
  Save,
  Check,
} from "lucide-react";

export default function ApplicationReviewPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Recruiter summary editing
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummaryText, setEditedSummaryText] = useState("");
  const [savingSummary, setSavingSummary] = useState(false);

  // Recruiter assessment override mode
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { status: EvidenceStatus; note: string }>>({});
  const [savingOverrides, setSavingOverrides] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const data = await api.getApplication(applicationId);
      setApplication(data);

      if (data.latest_summary) {
        setEditedSummaryText(
          data.latest_summary.recruiter_edited_summary || data.latest_summary.candidate_overview
        );
      }
      if (data.latest_assessment?.recruiter_overrides) {
        setOverrides(data.latest_assessment.recruiter_overrides);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    try {
      const updated = await api.updateApplicationStatus(application.id, newStatus);
      setApplication(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !application) return;
    try {
      setSavingNote(true);
      const note = await api.addRecruiterNote(application.id, newNote);
      setApplication({
        ...application,
        notes: [note, ...(application.notes || [])],
      });
      setNewNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!application?.latest_summary) return;
    try {
      setSavingSummary(true);
      const updated = await api.editRecruiterSummary(
        application.latest_summary.id,
        editedSummaryText
      );
      setApplication({
        ...application,
        latest_summary: updated,
      });
      setIsEditingSummary(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSummary(false);
    }
  };

  const handleSaveOverrides = async () => {
    if (!application?.latest_assessment) return;
    try {
      setSavingOverrides(true);
      const updated = await api.overrideAssessment(application.latest_assessment.id, overrides);
      setApplication({
        ...application,
        latest_assessment: updated,
      });
      setOverrideMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingOverrides(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading candidate evaluation...</div>;
  }

  if (!application) {
    return <div className="p-8 text-center text-slate-500">Application not found.</div>;
  }

  const cand = application.candidate;
  const assessment = application.latest_assessment;
  const summary = application.latest_summary;
  const doc = application.documents?.[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/applications"
            className="p-2.5 rounded-xl glass-panel text-slate-600 hover:text-slate-900 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {cand?.full_name || "Applicant Profile"}
              </h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Applying for:</span>
              <span className="font-semibold text-blue-700">{application.job_title}</span>
              <span>•</span>
              <span>Source: {application.source}</span>
            </div>
          </div>
        </div>

        {/* Status Transition Control in Glass */}
        <div className="flex items-center gap-2 glass-panel p-1.5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-600 px-2">Decision Stage:</span>
          <select
            value={application.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1.5 glass-input rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="Received">Received</option>
            <option value="Processing">Processing</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="On Hold">On Hold</option>
            <option value="Rejected">Rejected</option>
            <option value="Hired">Hired</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): AI Assessment & Recruiter Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Requirement Assessment Panel */}
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    Evidence-Based Requirement Assessment
                  </h2>
                  <p className="text-xs text-slate-500">
                    Model: {assessment?.model_name || "Google Gemini"} • Extracted with exact CV citations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {overrideMode ? (
                  <button
                    onClick={handleSaveOverrides}
                    disabled={savingOverrides}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-emerald-400/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingOverrides ? "Saving..." : "Save Corrections"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setOverrideMode(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/80 backdrop-blur-md transition-all shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Recruiter Challenge</span>
                  </button>
                )}
              </div>
            </div>

            {assessment?.overall_fit_summary && (
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 leading-relaxed backdrop-blur-md">
                <span className="font-bold text-blue-800">AI Fit Analysis: </span>
                {assessment.overall_fit_summary}
              </div>
            )}

            {/* Criteria Evaluation List */}
            <div className="space-y-4">
              {assessment?.criteria_assessments?.map((crit, idx) => {
                const override = overrides[crit.requirement_id || crit.title];
                const currentStatus = override?.status || crit.status;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur-md space-y-2.5 hover:border-blue-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{crit.title}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {crit.category}
                        </span>
                      </div>

                      {overrideMode ? (
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            setOverrides({
                              ...overrides,
                              [crit.requirement_id || crit.title]: {
                                status: e.target.value as EvidenceStatus,
                                note: override?.note || "Corrected by recruiter",
                              },
                            })
                          }
                          className="px-2 py-1 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          <option value="Evidenced">Evidenced</option>
                          <option value="Partially Evidenced">Partially Evidenced</option>
                          <option value="Not Found">Not Found</option>
                          <option value="Unclear">Unclear</option>
                        </select>
                      ) : (
                        <EvidenceStatusBadge status={currentStatus} />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{crit.explanation}</p>

                    {crit.cv_excerpt && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800 font-mono text-[11px] leading-relaxed">
                        <div className="text-[10px] text-blue-700 font-sans font-bold uppercase tracking-wider mb-1">
                          CV Excerpt Evidence (Page {crit.page_number || 1}):
                        </div>
                        "{crit.cv_excerpt}"
                      </div>
                    )}

                    {override && (
                      <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <span>✓ Recruiter Override Applied: Status marked as {override.status}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recruiter Summary Glass Panel */}
          {summary && (
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Executive Recruiter Summary</h2>
                    <p className="text-xs text-slate-500">
                      {summary.is_edited_by_recruiter === "true" ? "Verified & Edited by Recruiter" : "AI Generated Draft"}
                    </p>
                  </div>
                </div>

                {isEditingSummary ? (
                  <button
                    onClick={handleSaveSummary}
                    disabled={savingSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSummary ? "Saving..." : "Save Edits"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingSummary(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/80 backdrop-blur-md transition-all shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Summary</span>
                  </button>
                )}
              </div>

              {isEditingSummary ? (
                <textarea
                  rows={4}
                  value={editedSummaryText}
                  onChange={(e) => setEditedSummaryText(e.target.value)}
                  className="w-full p-3 glass-input rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-md"
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">
                  {summary.recruiter_edited_summary || summary.candidate_overview}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2 backdrop-blur-md">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Key Strengths
                  </div>
                  <ul className="text-xs text-emerald-900 space-y-1.5 list-disc list-inside">
                    {summary.key_strengths?.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2 backdrop-blur-md">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Potential Gaps / Areas to Probe
                  </div>
                  <ul className="text-xs text-amber-900 space-y-1.5 list-disc list-inside">
                    {summary.potential_gaps?.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggested Interview Questions */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 backdrop-blur-md">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Suggested Tailored Interview Questions
                </div>
                <div className="space-y-2 pt-1">
                  {summary.suggested_interview_questions?.map((q, i) => (
                    <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600">{i + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recruiter Notes Thread Glass Panel */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              <h2 className="font-bold text-slate-900 text-base">Internal Recruiter Notes</h2>
            </div>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Add confidential recruitment feedback, salary expectations, screening impressions..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-md"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !newNote.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Post Note"}
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-200/60 pt-2">
              {application.notes?.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No notes recorded yet.</div>
              ) : (
                application.notes?.map((n) => (
                  <div key={n.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{n.author_name || "Recruiter"}</span>
                      <span className="text-slate-400 font-mono">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Candidate Dossier & Document */}
        <div className="space-y-6">
          {/* Candidate Dossier Glass Card */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Candidate Dossier
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate font-mono">{cand?.email}</span>
              </div>
              {cand?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{cand.phone}</span>
                </div>
              )}
              {cand?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{cand.location}</span>
                </div>
              )}
              {cand?.linkedin_url && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-cyan-600 shrink-0" />
                  <a
                    href={cand.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>

            {/* Skills in Glass */}
            {cand?.skills && cand.skills.length > 0 && (
              <div className="pt-3 border-t border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Extracted Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cand.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-slate-700 text-[11px] font-medium backdrop-blur-sm shadow-xs"
                    >
                      {s.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Past Experiences */}
            {cand?.experiences && cand.experiences.length > 0 && (
              <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Work History</div>
                {cand.experiences.map((exp, idx) => (
                  <div key={idx} className="text-xs space-y-0.5">
                    <div className="font-semibold text-slate-900">{exp.role}</div>
                    <div className="text-slate-500 text-[11px]">
                      {exp.company} • {exp.start_date} - {exp.end_date || "Present"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CV Document Glass Card */}
          {doc && (
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Submitted CV Document
              </h3>

              <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200/80 flex items-center gap-2.5 shadow-xs">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">{doc.file_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB • {doc.file_type.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Storage Provider:</span>
                <span className="font-semibold text-slate-700 font-mono">{doc.storage_provider}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status:</span>
                <DocumentStatusBadge status={doc.status} />
              </div>

              <a
                href={`http://localhost:8000/api/v1/documents/${doc.id}/download`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-200/80 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Original Document</span>
              </a>
            </div>
          )}

          {/* Event Audit History Glass Card */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Event Audit Log</span>
            </h3>

            <div className="space-y-3 text-xs">
              {application.events?.map((ev) => (
                <div key={ev.id} className="border-l-2 border-blue-500 pl-3 space-y-0.5">
                  <div className="font-semibold text-slate-900 capitalize">
                    {ev.event_type.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] text-slate-500">{ev.details}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(ev.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

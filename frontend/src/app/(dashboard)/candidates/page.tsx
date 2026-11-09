"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Candidate } from "@/types";
import { Users, Search, Mail, Phone, MapPin, ExternalLink, ArrowRight } from "lucide-react";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCandidates();
  }, [search]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await api.listCandidates(search);
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Candidate Talent Pool</h1>
          <p className="text-sm text-slate-400">Centralized organization directory of parsed candidate profiles</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, skills, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 glass-input rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading talent pool...</div>
      ) : candidates.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="font-semibold text-white">No candidates in directory</h3>
          <p className="text-sm text-slate-400 mt-1">Candidates who submit CVs will automatically be registered here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="glass-card p-5 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 border border-white/10">
                    {c.full_name.charAt(0)}
                  </div>
                  {c.linkedin_url && (
                    <a
                      href={c.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">{c.full_name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>

                {c.professional_summary && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {c.professional_summary}
                  </p>
                )}

                {c.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.skills.slice(0, 4).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10px] font-medium"
                      >
                        {sk.skill_name}
                      </span>
                    ))}
                    {c.skills.length > 4 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{c.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Added {new Date(c.created_at).toLocaleDateString()}</span>
                <Link
                  href={`/candidates/${c.id}`}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Edit Profile</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

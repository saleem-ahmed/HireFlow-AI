"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ShieldCheck, Building2, Users, Briefcase, FileText, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await api.listAdminOrganizations();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.message || "Admin privileges required.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Administration</h1>
          <p className="text-sm text-slate-400">
            Superadmin multi-tenant governance, subscription tiers, and system capacity
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-6 glass-panel text-slate-300">
          <div className="font-semibold text-white mb-1">Superadmin Access Notice</div>
          <div className="text-sm text-slate-400">
            You are currently logged in with a standard recruiter account. To access global platform tenant metrics, log in as <span className="font-mono text-purple-400 font-semibold">admin@hireflow.ai</span>.
          </div>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-slate-400">Loading platform metrics...</div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="font-semibold text-white">Provisioned Organizations ({organizations.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 font-semibold">Organization</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Members</th>
                  <th className="px-6 py-3 font-semibold">Jobs</th>
                  <th className="px-6 py-3 font-semibold">Applications</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{org.name}</div>
                      <div className="text-xs text-slate-400 font-mono">slug: {org.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-purple-400">
                      {org.subscription_plan}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">{org.member_count}</td>
                    <td className="px-6 py-4 text-xs text-slate-300">{org.job_count}</td>
                    <td className="px-6 py-4 text-xs text-slate-300">{org.application_count}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

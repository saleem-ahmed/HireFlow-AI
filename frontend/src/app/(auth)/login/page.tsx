"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { Sparkles, ArrowRight, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      saveSession({
        token: res.access_token,
        userId: res.user_id,
        email: res.email,
        fullName: res.full_name,
        organizationId: res.organization_id,
        role: res.role,
      });
      if (res.email === "admin@hireflow.ai") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Light glassmorphism background orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-blue-200/50 rounded-full blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-96 h-96 bg-indigo-200/50 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-200/40 rounded-full blur-[120px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 border border-white/60 mb-4 backdrop-blur-md">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">HireFlow AI</h2>
        <p className="mt-2 text-sm text-slate-500">
          AI-Powered Recruitment & Evidence-Based CV Processing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 rounded-2xl sm:px-10 shadow-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recruiter@technova.io"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 border border-blue-400/30 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200/80">
            <div className="text-[11px] text-slate-500 mb-3 font-semibold uppercase tracking-wider">
              Quick Demo Accounts:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("recruiter@technova.io", "Password123!")}
                className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-left hover:border-blue-400/60 hover:bg-blue-50/60 text-slate-700 transition-all backdrop-blur-md shadow-xs"
              >
                <div className="font-semibold text-slate-900">Recruiter</div>
                <div className="text-[11px] text-slate-500 truncate">recruiter@technova.io</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@hireflow.ai", "AdminPass123!")}
                className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-left hover:border-purple-400/60 hover:bg-purple-50/60 text-slate-700 transition-all backdrop-blur-md shadow-xs"
              >
                <div className="font-semibold text-slate-900">Super Admin</div>
                <div className="text-[11px] text-slate-500 truncate">admin@hireflow.ai</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an organization?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

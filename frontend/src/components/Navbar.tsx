"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession, UserSession } from "@/lib/auth";
import { LogOut, Sparkles, Building2, ShieldCheck } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const isSuperadmin = session?.email === "admin@hireflow.ai";

  return (
    <header className="h-16 bg-white/75 backdrop-blur-2xl border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            {isSuperadmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            )}
          </div>
          <span className="font-bold text-slate-900 tracking-wide">
            {isSuperadmin ? "HireFlow Global Platform" : "TechNova Solutions"}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-semibold backdrop-blur-sm">
            {isSuperadmin ? "Super Admin" : (session?.role || "Recruiter")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-full px-3 py-1 text-xs text-blue-700 font-semibold backdrop-blur-md shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Gemini AI Engine Active</span>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 tracking-tight">
              {session?.fullName || "Sarah Jenkins"}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {session?.email || "recruiter@technova.io"}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

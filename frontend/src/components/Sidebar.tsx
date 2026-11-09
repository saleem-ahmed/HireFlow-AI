"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  FileScan,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jobs & Vacancies", href: "/jobs", icon: Briefcase },
    { name: "Applications Pipeline", href: "/applications", icon: FileText },
    { name: "Candidate Talent Pool", href: "/candidates", icon: Users },
    { name: "CV Processing Engine", href: "/cv-processing", icon: FileScan },
    { name: "Recruitment Reports", href: "/analytics", icon: TrendingUp },
    { name: "Platform Admin", href: "/admin", icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-white/70 backdrop-blur-2xl text-slate-700 flex flex-col shrink-0 min-h-screen border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200/80">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 border border-white/40">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">
            HireFlow
          </span>
          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
            AI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Recruitment Hub
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-50/90 text-blue-700 border border-blue-200/80 shadow-sm backdrop-blur-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Public Portals
        </div>
        <Link
          href="/portal/technova"
          target="_blank"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all"
        >
          <span className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 text-cyan-600" />
            <span>Candidate Portal</span>
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold border border-emerald-200">
            Live
          </span>
        </Link>
      </nav>

      {/* Footer Tenant status badge */}
      <div className="p-4 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col gap-1.5 bg-slate-50/60 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Tenant Isolation</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Enforced
          </span>
        </div>
        <div className="text-[11px] text-slate-700 truncate font-mono">Org: TechNova Solutions</div>
      </div>
    </aside>
  );
}

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HireFlow AI — AI-Powered Recruitment & CV Processing",
  description: "Evidence-based AI recruitment management, candidate extraction, and multi-tenant SaaS platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}


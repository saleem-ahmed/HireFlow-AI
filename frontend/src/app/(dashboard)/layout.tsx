import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen relative overflow-x-hidden selection:bg-blue-500/20 selection:text-blue-900 text-slate-800">
      {/* Background ambient light orbs for depth */}
      <div className="fixed top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-blue-400/20 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-300/20 blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[25%] w-[50vw] h-[40vw] rounded-full bg-sky-300/20 blur-[130px] pointer-events-none -z-10" />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

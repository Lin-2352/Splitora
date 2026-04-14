"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatBot from "@/components/chat/ChatBot";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00f2fe]"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950 light:bg-slate-50 text-slate-300 light:text-slate-600 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        {children}
      </main>
      <ChatBot />
    </div>
  );
}

"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatBot from "@/components/chat/ChatBot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-app-bg text-slate-300 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        {children}
      </main>
      <ChatBot />
    </div>
  );
}

"use client";

import { NotificationProvider } from "@/lib/NotificationContext";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#F2F4FA]">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
          {children}
          <BottomNav />
        </main>
      </div>
    </NotificationProvider>
  );
}

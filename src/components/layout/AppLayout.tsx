"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

/**
 * AppLayout — the root shell for every screen.
 *
 * Mobile (<md): full viewport, BottomNav fixed at the bottom.
 * Desktop (>=md): 240px dark Sidebar on the left, content fills the rest.
 *
 * Screen components must NOT render BottomNav themselves — it lives here.
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F2F4FA]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        {children}
        <BottomNav />
      </main>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

export function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Suspense>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </Suspense>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Suspense>
          <DashboardHeader onMenuToggle={() => setSidebarOpen((o) => !o)} />
        </Suspense>
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-accent">{children}</main>
      </div>
    </div>
  );
}

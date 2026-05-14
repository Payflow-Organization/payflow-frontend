import DashboardHeader from "@/components/features/layout/DashboardHeader";
import Sidebar from "@/components/features/layout/Sidebar";
import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Suspense>
          <Sidebar />
        </Suspense>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Suspense>
            <DashboardHeader />
          </Suspense>
          <main className="flex-1 overflow-auto p-8 bg-accent">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

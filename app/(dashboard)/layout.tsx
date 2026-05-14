import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { DashboardLayoutShell } from "@/components/features/layout/DashboardLayoutShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayoutShell>{children}</DashboardLayoutShell>
    </AuthGuard>
  );
}

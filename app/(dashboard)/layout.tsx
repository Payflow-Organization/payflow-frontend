import DashboardHeader from "@/components/features/layout/DaboardHeader";
import Sidebar from "@/components/features/layout/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-8 bg-accent">{children}</main>
      </div>
    </div>
  );
}

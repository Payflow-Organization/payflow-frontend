"use client";
import { useMe } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useMe();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return <>{children}</>;
}

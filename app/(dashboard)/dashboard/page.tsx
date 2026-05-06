"use client";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/hooks/use-auth";

export default function Page() {
  const { mutate: logout, isPending } = useLogout();
  return (
    <div>
      <Button variant="outline" onClick={() => logout()} disabled={isPending}>
        Logout
      </Button>
    </div>
  );
}

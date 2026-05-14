import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  icon,
  isLoading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-6 h-24 flex gap-4 items-center">
      {isLoading ? (
        <>
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        </>
      ) : (
        <>
          <span className="flex items-center bg-primary/10 p-3 rounded-full text-primary">
            {icon}
          </span>
          <div>
            <p className="text-sm text-muted-foreground uppercase">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </>
      )}
    </div>
  );
}

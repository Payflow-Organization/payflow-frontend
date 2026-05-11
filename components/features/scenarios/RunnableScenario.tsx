import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ResultPanel } from "./ResultPanel";
import type { ScenarioResult } from "@/lib/scenarios/types";

export function RunnableScenario({ icon, title, description, guarantee, run, disabled = false, badge = "SIMULATED" }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  guarantee: string;
  run: () => Promise<ScenarioResult>;
  disabled?: boolean;
  badge?: string;
}) {
  const [state, setState] = useState<"idle" | "running">("idle");
  const [result, setResult] = useState<ScenarioResult | null>(null);

  async function handleRun() {
    setState("running");
    setResult(null);
    try {
      setResult(await run());
    } catch (e) {
      setResult({
        status: "fail",
        summary: e instanceof Error ? e.message : "Unexpected error",
        rows: [],
        durationMs: 0,
        swapNote: "",
      });
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs py-0 h-5 font-mono",
                badge === "LIVE" ? "text-primary border-primary/40" : "text-muted-foreground",
              )}
            >
              {badge}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <p className="text-xs text-muted-foreground/60">
            <span className="font-medium">Backend guarantee:</span> {guarantee}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full h-7 px-3 text-xs shrink-0 gap-1.5"
          onClick={handleRun}
          disabled={state === "running" || disabled}
        >
          {state === "running"
            ? <><Loader2 size={12} className="animate-spin" /> Running…</>
            : <><Play size={12} /> Run</>}
        </Button>
      </div>

      {state === "running" && !result && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-3.5 w-full" />)}
        </div>
      )}

      {result && <ResultPanel result={result} />}
    </div>
  );
}

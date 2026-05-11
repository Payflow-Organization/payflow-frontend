import { CheckCircle, AlertCircle, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScenarioResult } from "@/lib/scenarios/types";

const STATUS_CONFIG = {
  pass: {
    icon: <CheckCircle size={14} className="text-primary shrink-0" />,
    banner: "bg-primary/5 border-primary/20 text-primary",
  },
  warn: {
    icon: <AlertCircle size={14} className="text-amber-500 shrink-0" />,
    banner: "bg-amber-50 border-amber-200 text-amber-700",
  },
  fail: {
    icon: <AlertCircle size={14} className="text-destructive shrink-0" />,
    banner: "bg-destructive/5 border-destructive/20 text-destructive",
  },
};

export function ResultPanel({ result }: { result: ScenarioResult }) {
  const { icon, banner } = STATUS_CONFIG[result.status];

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden text-sm">
      <div className={cn("flex items-start gap-2 px-4 py-3 border-b border-border", banner)}>
        {icon}
        <span className="font-medium leading-snug">{result.summary}</span>
        {result.durationMs > 0 && (
          <span className="ml-auto text-xs opacity-70 shrink-0">{result.durationMs}ms</span>
        )}
      </div>

      {result.rows.length > 0 && (
        <div className="divide-y divide-border">
          {result.rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-4">
              <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
              <span className={cn(
                "text-xs text-right",
                row.mono && "font-mono",
                row.status === "pass" && "text-primary",
                row.status === "fail" && "text-destructive",
                row.status === "neutral" && "text-foreground",
              )}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {result.swapNote && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-muted/30 border-t border-border">
          <Terminal size={12} className="text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-xs text-muted-foreground font-mono">{result.swapNote}</span>
        </div>
      )}
    </div>
  );
}

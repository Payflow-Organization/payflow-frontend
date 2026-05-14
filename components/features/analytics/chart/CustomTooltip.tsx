interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  currency: string;
}

export function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  const current = payload.find((p) => p.dataKey === "value")?.value ?? 0;
  const previous = payload.find((p) => p.dataKey === "prev")?.value;
  return (
    <div className="bg-background border border-border rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-primary">Current: {fmt(current)}</p>
      {previous != null && (
        <p className="text-[#999]">Previous: {fmt(previous)}</p>
      )}
    </div>
  );
}

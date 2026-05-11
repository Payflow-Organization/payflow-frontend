"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllTimeSummary } from "@/lib/hooks/use-analytics";
import { useWallet } from "@/lib/hooks/use-wallet";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";

function SummaryCard({
  label,
  amount,
  currency,
  subtitle,
  subtitleColor,
  icon,
}: {
  label: string;
  amount: number;
  currency: string;
  subtitle: string;
  subtitleColor: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-border relative overflow-hidden">
      <CardContent className="p-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
        <p className={`text-xs font-medium ${subtitleColor}`}>{subtitle}</p>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.08]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function TransactionSummaryCards({ walletId }: { walletId: string }) {
  const { data: wallet } = useWallet(walletId);
  const from = wallet?.createdAt.split("T")[0] ?? "1970-01-01";
  const { inflowCents, outflowCents, netCents, currency, isLoading } =
    useAllTimeSummary(walletId, from);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <SummaryCard
        label="Total Inflow"
        amount={inflowCents}
        currency={currency}
        subtitle="All deposits to this wallet"
        subtitleColor="text-primary"
        icon={<ArrowDownLeft size={72} className="text-primary" />}
      />
      <SummaryCard
        label="Total Outflow"
        amount={outflowCents}
        currency={currency}
        subtitle="Withdrawals & transfers sent"
        subtitleColor="text-muted-foreground"
        icon={<ArrowUpRight size={72} className="text-foreground" />}
      />
      <SummaryCard
        label="Net Flow"
        amount={netCents}
        currency={currency}
        subtitle={netCents >= 0 ? "Net positive balance" : "Net negative balance"}
        subtitleColor={netCents >= 0 ? "text-primary" : "text-destructive"}
        icon={<TrendingUp size={72} className={netCents >= 0 ? "text-primary" : "text-destructive"} />}
      />
    </div>
  );
}

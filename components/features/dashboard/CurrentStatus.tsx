import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, cn } from "@/lib/utils";
import type { MonthlySummary } from "@/lib/types";

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function expenseRatioOf(summary: MonthlySummary | undefined) {
  const deposits = summary?.totalDepositsCents ?? 0;
  return deposits > 0
    ? ((summary?.totalWithdrawalsCents ?? 0) / deposits) * 100
    : 0;
}

function deriveStats(
  current: MonthlySummary | undefined,
  prev: MonthlySummary | undefined,
  allTimeWithdrawalsCents: number,
) {
  const netFlow = current?.netCents ?? 0;
  const prevNetFlow = prev?.netCents ?? 0;
  const expenseRatio = expenseRatioOf(current);

  return {
    netFlow: {
      cents: netFlow,
      changePct:
        prevNetFlow !== 0
          ? ((netFlow - prevNetFlow) / Math.abs(prevNetFlow)) * 100
          : 0,
      barPct:
        (current?.totalDepositsCents ?? 0) > 0
          ? Math.min(
              100,
              Math.max(0, (netFlow / current!.totalDepositsCents) * 100),
            )
          : 0,
      transactionCount: current?.transactionCount ?? 0,
    },
    expenseRatio: {
      value: expenseRatio,
      change: expenseRatio - expenseRatioOf(prev),
    },
    debits: {
      totalCents: allTimeWithdrawalsCents,
      changePct:
        (prev?.totalWithdrawalsCents ?? 0) > 0
          ? ((allTimeWithdrawalsCents - (prev?.totalWithdrawalsCents ?? 0)) /
              (prev?.totalWithdrawalsCents ?? 0)) *
            100
          : 0,
    },
  };
}

export function CurrentStatus({
  currentSummary,
  prevSummary,
  allTimeWithdrawalsCents,
  currency,
  isLoading,
}: {
  currentSummary: MonthlySummary | undefined;
  prevSummary: MonthlySummary | undefined;
  allTimeWithdrawalsCents: number;
  currency: string;
  isLoading?: boolean;
}) {
  const { netFlow, expenseRatio, debits } = deriveStats(
    currentSummary,
    prevSummary,
    allTimeWithdrawalsCents,
  );

  return (
    <div className="rounded-2xl border border-border bg-background p-6 space-y-6">
      <h2 className="text-xl font-normal text-foreground">Current Status</h2>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-base text-muted-foreground">Net Flow</span>
          {isLoading ? (
            <Skeleton className="h-4 w-12" />
          ) : (
            <span
              className={cn(
                "text-base font-medium",
                netFlow.changePct >= 0 ? "text-primary" : "text-destructive",
              )}
            >
              {fmtPct(netFlow.changePct)}
            </span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-36" />
        ) : (
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(netFlow.cents, currency)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              this month
            </span>
          </p>
        )}
        {!isLoading && netFlow.transactionCount > 0 && (
          <p className="text-xs text-muted-foreground">
            across {netFlow.transactionCount} transactions
          </p>
        )}
        <Progress value={isLoading ? 0 : netFlow.barPct} className="h-1.5" />
      </div>

      <div className="border-t border-border" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-base text-muted-foreground">Expense Ratio</span>
          {isLoading ? (
            <Skeleton className="h-4 w-12" />
          ) : (
            <span
              className={cn(
                "text-sm font-medium",
                expenseRatio.change <= 0 ? "text-primary" : "text-destructive",
              )}
            >
              {fmtPct(expenseRatio.change)}
            </span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <p className="text-2xl font-semibold text-foreground">
            {expenseRatio.value.toFixed(1)}%
          </p>
        )}
        <Progress
          value={isLoading ? 0 : Math.min(100, expenseRatio.value)}
          className="h-1.5"
        />
      </div>

      <div className="border-t border-border" />

      <div className="space-y-1.5">
        <span className="text-base text-muted-foreground">Debits Total</span>
        {isLoading ? (
          <Skeleton className="h-7 w-32" />
        ) : (
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(debits.totalCents, currency)}
          </p>
        )}
        {!isLoading && (
          <p className="text-xs text-muted/70 leading-relaxed">
            Total debits across all active wallets have{" "}
            {debits.changePct <= 0 ? "decreased" : "increased"} by{" "}
            {Math.abs(debits.changePct).toFixed(0)}% compared to the previous
            month.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useWallets } from "@/lib/hooks/use-wallet";
import {
  useMonthlySummary,
  useSpendingByCategory,
} from "@/lib/hooks/use-analytics";
import {
  type Period,
  type DateRange,
  formatRangeLabel,
  AnalyticsChart,
} from "@/components/features/analytics/chart/AnalyticsChart";

import { MetricCards } from "@/components/features/analytics/MetricCards";
import { TransactionBreakdown } from "@/components/features/analytics/TransactionBreakDown";
import {
  MonthlyPicker,
  QuarterPicker,
  YearPicker,
} from "@/components/features/analytics/date-pickers";

function deriveMetrics(
  period: Period,
  summary: { totalDepositsCents: number; totalWithdrawalsCents: number; netCents: number } | undefined,
  spending: { transactionType: string; totalCents: number }[] | undefined,
) {
  const find = (type: string) => spending?.find((s) => s.transactionType === type)?.totalCents ?? 0;
  const deposits = period === "Monthly" ? (summary?.totalDepositsCents ?? 0) : find("DEPOSIT");
  const withdrawals = period === "Monthly" ? (summary?.totalWithdrawalsCents ?? 0) : find("WITHDRAW");
  const transfers = period !== "Monthly" ? find("TRANSFER") : 0;
  const net = period === "Monthly" ? (summary?.netCents ?? 0) : deposits - withdrawals - transfers;
  return { deposits, withdrawals, transfers, net };
}

function getDefaultRanges(): Record<Period, DateRange> {
  const now = new Date();
  const y = now.getFullYear();
  const cq = Math.floor(now.getMonth() / 3);
  return {
    Monthly: { from: startOfMonth(now), to: endOfMonth(now) },
    Quarterly: {
      from: new Date(y, cq * 3, 1),
      to: endOfMonth(new Date(y, cq * 3 + 2, 1)),
    },
    Yearly: { from: new Date(y, 0, 1), to: new Date(y, 11, 31) },
  };
}

const DEFAULT_RANGES = getDefaultRanges();

export default function PortfolioAnalytics() {
  return (
    <Suspense>
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsContent() {
  const walletId = useSearchParams().get("walletId") ?? "";
  const { data: wallets } = useWallets();
  const activeWallet = wallets?.find((w) => w.id === walletId) ?? wallets?.[0];
  const currency = activeWallet?.currency ?? "GBP";
  const resolvedWalletId = walletId || (wallets?.[0]?.id ?? "");

  const [period, setPeriod] = useState<Period>("Monthly");
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGES.Monthly);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fromStr = format(dateRange.from, "yyyy-MM-dd");
  const toStr = format(dateRange.to, "yyyy-MM-dd");
  // "yyyy-MM" — useMonthlySummary uses the period's start month as the bucket key
  const monthStr = format(dateRange.from, "yyyy-MM");

  // Monthly → useMonthlySummary (backend-computed net). Quarterly/Yearly → useSpendingByCategory
  // (full range via from/to; net computed on frontend from two backend category values).
  const { data: summary, isLoading: isSummaryLoading } = useMonthlySummary(
    resolvedWalletId,
    monthStr,
  );
  const { data: spending = [], isLoading: isSpendingLoading } =
    useSpendingByCategory(resolvedWalletId, fromStr, toStr);

  const isMetricsLoading = period === "Monthly" ? isSummaryLoading : isSpendingLoading;
  const { deposits: depositsCents, withdrawals: withdrawalsCents, net: netCents } =
    deriveMetrics(period, summary, spending);

  const displayLabel = formatRangeLabel(dateRange.from, dateRange.to, period);
  const pickerKey = `${period}-${dateRange.from.getTime()}-${dateRange.to.getTime()}`;

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setDateRange(DEFAULT_RANGES[p]);
  };

  const handleApply = (range: DateRange) => {
    setDateRange(range);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            Transaction Analytics
          </h1>
          <p className="text-base text-muted/70 font-normal mt-0.5">
            Real-time performance tracking and flow analysis.
          </p>
        </div>

        <div className="flex items-center overflow-x-auto">
          <div className="flex items-center gap-2 bg-background border border-border rounded-full px-2 py-1.5 shadow-sm shrink-0">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs text-muted-foreground font-medium gap-1.5 rounded-full hover:bg-accent data-[state=open]:bg-accent"
                >
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  {displayLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 overflow-hidden"
                align="start"
              >
                {period === "Monthly" && (
                  <MonthlyPicker
                    key={pickerKey}
                    value={dateRange}
                    onApply={handleApply}
                  />
                )}
                {period === "Quarterly" && (
                  <QuarterPicker
                    key={pickerKey}
                    value={dateRange}
                    onApply={handleApply}
                  />
                )}
                {period === "Yearly" && (
                  <YearPicker
                    key={pickerKey}
                    value={dateRange}
                    onApply={handleApply}
                  />
                )}
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-5" />

            <Tabs
              value={period}
              onValueChange={(v) => handlePeriodChange(v as Period)}
            >
              <TabsList className="h-auto bg-transparent gap-0.5 p-0">
                {(["Monthly", "Quarterly", "Yearly"] as Period[]).map((p) => (
                  <TabsTrigger
                    key={p}
                    value={p}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-all border-0 shadow-none",
                      "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none",
                      "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground",
                    )}
                  >
                    {p}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <MetricCards
        depositsCents={depositsCents}
        withdrawalsCents={withdrawalsCents}
        netCents={netCents}
        period={period}
        dateRange={dateRange}
        currency={currency}
        isLoading={isMetricsLoading}
      />
      <AnalyticsChart
        walletId={resolvedWalletId}
        period={period}
        dateRange={dateRange}
        currency={currency}
      />
      <TransactionBreakdown
        spending={spending}
        currency={currency}
        isLoading={isSpendingLoading}
        walletId={resolvedWalletId}
        from={fromStr}
        to={toStr}
      />
    </div>
  );
}

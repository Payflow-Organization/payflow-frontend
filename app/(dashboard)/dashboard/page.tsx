"use client";

import {
  useSpendingByCategory,
  useMonthlySummary,
} from "@/lib/hooks/use-analytics";
import { useWallets } from "@/lib/hooks/use-wallet";
import { useRecentTransactions } from "@/lib/hooks/use-transactions";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import { TrendingUp } from "lucide-react";
import { Suspense } from "react";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import { AnalyticsChart } from "@/components/features/analytics/chart/AnalyticsChart";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { CurrentStatus } from "@/components/features/dashboard/CurrentStatus";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";

const today = new Date().toISOString().split("T")[0];
const currentMonthStr = format(new Date(), "yyyy-MM");
const prevMonthStr = format(subMonths(new Date(), 1), "yyyy-MM");
const currentMonthRange = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date()),
};

export default function Page() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const walletId = useSearchParams().get("walletId") ?? "";
  const { data: wallets, isLoading: isWalletsLoading } = useWallets();

  const activeWallet = wallets?.find((w) => w.id === walletId) ?? wallets?.[0];
  const resolvedWalletId = walletId || (activeWallet?.id ?? "");
  const currency = activeWallet?.currency ?? "GBP";
  const allTimeFrom = activeWallet?.createdAt.split("T")[0] ?? "1970-01-01";

  const { data: spending, isLoading: isSpendingLoading } =
    useSpendingByCategory(resolvedWalletId, allTimeFrom, today);
  const totalDeposits =
    spending?.find((s) => s.transactionType === "DEPOSIT")?.totalCents ?? 0;
  const totalWithdrawals =
    spending?.find((s) => s.transactionType === "WITHDRAW")?.totalCents ?? 0;

  const { data: recentTx = [], isLoading: isTxLoading } = useRecentTransactions(
    resolvedWalletId,
    5,
  );
  const { data: currentSummary, isLoading: isCurrentSummaryLoading } =
    useMonthlySummary(resolvedWalletId, currentMonthStr);
  const { data: prevSummary } = useMonthlySummary(
    resolvedWalletId,
    prevMonthStr,
  );

  const isLoading = isWalletsLoading || isSpendingLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          label="Total Net Worth"
          value={formatCurrency(activeWallet?.balance ?? 0, currency)}
          icon={<PaymentsOutlinedIcon className="-scale-x-100" />}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Deposits"
          value={formatCurrency(totalDeposits, currency)}
          icon={<TrendingUp />}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Withdrawals"
          value={formatCurrency(totalWithdrawals, currency)}
          icon={<SavingsOutlinedIcon />}
          isLoading={isLoading}
        />
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-[2] flex flex-col gap-6">
          <AnalyticsChart
            walletId={resolvedWalletId}
            period="Monthly"
            dateRange={currentMonthRange}
            currency={currency}
            height={280}
            viewMoreHref={`/analytics?walletId=${resolvedWalletId}`}
          />
          <RecentActivity
            transactions={recentTx}
            currency={currency}
            walletId={resolvedWalletId}
            isLoading={isTxLoading}
          />
        </div>

        <div className="flex-[1] flex flex-col gap-6">
          <CurrentStatus
            currentSummary={currentSummary}
            prevSummary={prevSummary}
            allTimeWithdrawalsCents={totalWithdrawals}
            currency={currency}
            isLoading={isCurrentSummaryLoading}
          />
          <div className="rounded-2xl border border-border bg-background p-6 h-[220px]">
            <h2 className="text-xl font-medium text-muted-foreground mb-4">
              Wallet Details
            </h2>
            <div>
              {[
                ["Wallet ID", `W-...${activeWallet?.id.slice(-4) ?? "N/A"}`],
                ["Currency", currency],
                [
                  "Created At",
                  activeWallet
                    ? format(new Date(activeWallet.createdAt), "MMM d, yyyy")
                    : "N/A",
                ],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

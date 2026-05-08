"use client";

export const dynamic = 'force-dynamic';

import { useSpendingByCategory } from "@/lib/hooks/use-analytics";
import { useWallets } from "@/lib/hooks/use-wallet";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const today = new Date().toISOString().split("T")[0];
const month = new Date().toISOString().slice(0, 7);
const allTimeFrom = "1970-01-01";
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

export default function Page() {
  const searchParams = useSearchParams();
  const { data: wallets, isLoading: isWalletsLoading } = useWallets();
  const walletId = searchParams.get("walletId") ?? wallets?.[0]?.id ?? "";

  const { data: spending, isLoading: isSpendingLoading } =
    useSpendingByCategory(walletId, allTimeFrom, today);

  const activeWallet = wallets?.find((w) => w.id === walletId) ?? wallets?.[0];
  const currency = activeWallet?.currency ?? "GBP";

  const netWorth = activeWallet?.balance ?? 0;
  const totalDeposits =
    spending?.find((s) => s.transactionType === "DEPOSIT")?.totalCents ?? 0;
  const totalWithdrawals =
    spending?.find((s) => s.transactionType === "WITHDRAW")?.totalCents ?? 0;

  const isLoading = isWalletsLoading || isSpendingLoading;

  return (
    <div className="space-y-6">
      {/* Row 1 - Stat Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          label="Total Net Worth"
          value={formatCurrency(netWorth, currency)}
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

      {/* Main Grid - 3 cols, 2 rows */}
      {/* Left (col 1-2): chart on top, recent activity below */}
      {/* Right (col 3): current status + wallet details spanning both rows */}
      <div className="flex gap-6 items-start">
        {/* Left column */}
        <div className="flex-[2] flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-background p-6 h-[340px]">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Wealth Trajectory
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6 h-[340px]">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Recent Activity
            </h2>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-[1] flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-background p-6 h-[400px]">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Current Status
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6 h-[220px]">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Wallet Details
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
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

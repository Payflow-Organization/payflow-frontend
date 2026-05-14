"use client";

import type { ReactNode } from "react";
import { CirclePlus, TrendingUp } from "lucide-react";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { format, getMonth, getYear, isSameMonth, isSameYear } from "date-fns";
import type { Period, DateRange } from "./chart/AnalyticsChart";

interface CardConfig {
  suffix: string;
  getValue: (
    deposits: number,
    withdrawals: number,
    net: number,
    currency: string,
  ) => string;
  icon: ReactNode;
  iconBg: string;
  cardClass?: string;
  labelClass?: string;
  valueClass?: string;
}

const CARD_CONFIGS: CardConfig[] = [
  {
    suffix: "Deposits",
    getValue: (deposits, _, __, currency) => formatCurrency(deposits, currency),
    icon: <CirclePlus className="fill-primary/70 stroke-[#e8f5f0]" />,
    iconBg: "bg-[#e8f5f0]",
    cardClass: "border-muted/50",
  },
  {
    suffix: "Withdrawals",
    getValue: (_d, withdrawals, _n, currency) =>
      formatCurrency(withdrawals, currency),
    icon: <AccountBalanceWalletIcon className="h-3.5 w-3.5 text-foreground" />,
    iconBg: "bg-accent",
  },
  {
    suffix: "Net Flow",
    getValue: (_d, _w, net, currency) =>
      `${net >= 0 ? "+" : "-"}${formatCurrency(Math.abs(net), currency)}`,
    icon: <TrendingUp className="text-background" />,
    iconBg: "bg-white/20",
    cardClass: "bg-primary",
    labelClass: "text-white/80",
    valueClass: "text-white",
  },
];

function formatCardPrefix(dateRange: DateRange, period: Period): string {
  const { from, to } = dateRange;
  if (period === "Monthly") {
    if (isSameMonth(from, to)) return format(from, "MMM yyyy");
    if (isSameYear(from, to))
      return `${format(from, "MMM")} – ${format(to, "MMM yyyy")}`;
    return `${format(from, "MMM yyyy")} – ${format(to, "MMM yyyy")}`;
  }
  if (period === "Quarterly") {
    const sq = Math.floor(getMonth(from) / 3) + 1;
    const eq = Math.floor(getMonth(to) / 3) + 1;
    const sy = getYear(from),
      ey = getYear(to);
    if (sy === ey) return sq === eq ? `Q${sq} ${sy}` : `Q${sq} – Q${eq} ${sy}`;
    return `Q${sq} ${sy} – Q${eq} ${ey}`;
  }
  const sy = getYear(from),
    ey = getYear(to);
  return sy === ey ? `${sy}` : `${sy} – ${ey}`;
}

interface MetricCardsProps {
  depositsCents: number;
  withdrawalsCents: number;
  netCents: number;
  period: Period;
  dateRange: DateRange;
  currency: string;
  isLoading?: boolean;
}

export function MetricCards({
  depositsCents,
  withdrawalsCents,
  netCents,
  period,
  dateRange,
  currency,
  isLoading,
}: MetricCardsProps) {
  const prefix = formatCardPrefix(dateRange, period);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
      {CARD_CONFIGS.map((cfg) => (
        <Card key={cfg.suffix} className={cfg.cardClass}>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={cn(
                    "text-sm font-medium mb-1",
                    cfg.labelClass ?? "text-muted-foreground",
                  )}
                >
                  {prefix} {cfg.suffix}
                </p>
                {isLoading ? (
                  <Skeleton className="h-5 w-28 mt-1" />
                ) : (
                  <p
                    className={cn(
                      "text-base font-normal",
                      cfg.valueClass ?? "text-foreground",
                    )}
                  >
                    {cfg.getValue(
                      depositsCents,
                      withdrawalsCents,
                      netCents,
                      currency,
                    )}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  cfg.iconBg,
                )}
              >
                {cfg.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

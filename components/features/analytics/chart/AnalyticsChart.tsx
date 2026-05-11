"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addMonths,
  differenceInDays,
  format,
  getMonth,
  getYear,
  subDays,
} from "date-fns";
import Link from "next/link";
import { useBalanceHistory } from "@/lib/hooks/use-analytics";
import type { BalanceHistoryPoint } from "@/lib/types";
import { CustomTooltip } from "./CustomTooltip";
import { CustomDot } from ".";

export type Period = "Monthly" | "Quarterly" | "Yearly";

export interface DateRange {
  from: Date;
  to: Date;
}

// ─── Range label ──────────────────────────────────────────────────────────────
export function formatRangeLabel(from: Date, to: Date, period: Period): string {
  if (period === "Monthly")
    return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
  if (period === "Quarterly") {
    const sq = Math.floor(getMonth(from) / 3) + 1;
    const eq = Math.floor(getMonth(to) / 3) + 1;
    const sy = getYear(from),
      ey = getYear(to);
    if (sy === ey) return sq === eq ? `Q${sq} ${sy}` : `Q${sq} - Q${eq} ${sy}`;
    return `Q${sq} ${sy} - Q${eq} ${ey}`;
  }
  const sy = getYear(from),
    ey = getYear(to);
  return sy === ey ? `${sy}` : `${sy} - ${ey}`;
}

const MONTHS_SHORT = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
    new Date(2000, i, 1),
  ),
);

function getInterval(period: Period, from: Date, to: Date): string {
  if (period === "Monthly" && differenceInDays(to, from) <= 35) return "1 week";
  return "1 month";
}

function getPreviousPeriod(from: Date, to: Date, period: Period): [Date, Date] {
  if (period === "Quarterly") return [addMonths(from, -3), addMonths(to, -3)];
  if (period === "Yearly")
    return [
      new Date(from.getFullYear() - 1, 0, 1),
      new Date(to.getFullYear() - 1, 11, 31),
    ];
  // Monthly: shift back by the same number of days
  const days = differenceInDays(to, from) + 1;
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, days - 1);
  return [prevFrom, prevTo];
}

function buildLabel(
  point: BalanceHistoryPoint,
  interval: string,
  allPoints: BalanceHistoryPoint[],
): string {
  const date = new Date(point.interval);
  if (interval === "1 week") {
    const start = new Date(allPoints[0].interval);
    const weekNum = Math.round(differenceInDays(date, start) / 7) + 1;
    return `Week ${weekNum}`;
  }
  const firstYear = new Date(allPoints[0].interval).getFullYear();
  const lastYear = new Date(
    allPoints[allPoints.length - 1].interval,
  ).getFullYear();
  const multiYear = firstYear !== lastYear;
  return (
    MONTHS_SHORT[date.getUTCMonth()] +
    (multiYear ? ` ${date.getUTCFullYear()}` : "")
  );
}

// ─── Chart Component ──────────────────────────────────────────────────────────
interface AnalyticsChartProps {
  walletId: string;
  period: Period;
  dateRange: DateRange;
  currency: string;
  height?: number;
  viewMoreHref?: string;
}

export function AnalyticsChart({
  walletId,
  period,
  dateRange,
  currency,
  height = 500,
  viewMoreHref,
}: AnalyticsChartProps) {
  const interval = getInterval(period, dateRange.from, dateRange.to);
  const [prevFrom, prevTo] = getPreviousPeriod(
    dateRange.from,
    dateRange.to,
    period,
  );

  const fromStr = format(dateRange.from, "yyyy-MM-dd");
  const toStr = format(dateRange.to, "yyyy-MM-dd");
  const prevFromStr = format(prevFrom, "yyyy-MM-dd");
  const prevToStr = format(prevTo, "yyyy-MM-dd");

  const { data: current = [], isLoading: isCurrentLoading } = useBalanceHistory(
    walletId,
    fromStr,
    toStr,
    interval,
  );
  const { data: previous = [], isLoading: isPrevLoading } = useBalanceHistory(
    walletId,
    prevFromStr,
    prevToStr,
    interval,
  );

  const isLoading = isCurrentLoading || isPrevLoading;

  const chartData = useMemo(
    () =>
      current.map((point, i) => ({
        label: buildLabel(point, interval, current),
        // Convert cents → currency units while preserving sub-unit precision
        value: point.lastBalanceCents / 100,
        prev: previous[i] ? previous[i].lastBalanceCents / 100 : 0,
      })),
    [current, previous, interval],
  );

  const yDomain = useMemo((): [number, number] => {
    if (chartData.length === 0) return [0, 1000];
    const allVals = chartData.flatMap((d) => [d.value, d.prev]).filter(Boolean);
    const min = Math.min(...allVals),
      max = Math.max(...allVals);
    return [Math.floor(min * 0.92), Math.ceil(max * 1.08)];
  }, [chartData]);

  const subtitle =
    interval === "1 week"
      ? "Balance history grouped by weekly"
      : period === "Yearly"
        ? "Balance history grouped by yearly"
        : period === "Quarterly"
          ? "Balance history grouped by quarterly"
          : "Balance history grouped by monthly";

  return (
    <Card>
      <CardHeader className="pb-2 pt-5 px-15">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Transaction history
            </CardTitle>
            <CardDescription className="text-sm mt-0.5 font-medium text-muted/70">
              {subtitle}
            </CardDescription>
            {viewMoreHref && (
              <Link
                href={viewMoreHref}
                className="text-xs text-primary font-medium mt-1 inline-block hover:underline"
              >
                View more →
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <span className="w-3 h-3 rounded-full bg-primary shrink-0" />
              Current Period
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <span className="w-3 h-3 rounded-full bg-[#aaa] shrink-0" />
              Previous
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-10 pb-4">
        {isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height }} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={chartData}
              margin={{ top: 16, right: 20, left: 20, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray=""
                stroke="#F3F4F6"
                strokeOpacity={0.8}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 14, fill: "#A3A3A3", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickMargin={50}
              />
              <YAxis hide domain={yDomain} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Line
                type="monotone"
                dataKey="prev"
                stroke="#aaaaaa"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#16a085"
                strokeWidth={3}
                isAnimationActive={false}
                dot={(props) => (
                  <CustomDot
                    key={`dot-${props.index}`}
                    cx={props.cx as number}
                    cy={props.cy as number}
                    index={props.index as number}
                    dataLength={chartData.length}
                  />
                )}
                activeDot={{
                  r: 4,
                  fill: "#16a085",
                  stroke: "white",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getBalanceHistory,
  getMonthlySummary,
} from "@/lib/api/analytics";
import { mockGetSpendingByCategory } from "@/lib/mocks/transaction";
import type { SpendingByCategory } from "@/lib/types";

const ANALYTICS_STALE_TIME = 5 * 60 * 1000;

export function useMonthlySummary(walletId: string, month: string) {
  return useQuery({
    queryKey: ["analytics", "summary", walletId, month],
    queryFn: () => getMonthlySummary(walletId, month),
    enabled: !!walletId && !!month,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useBalanceHistory(
  walletId: string,
  from: string,
  to: string,
  interval = "1 day",
) {
  return useQuery({
    queryKey: ["analytics", "history", walletId, from, to, interval],
    queryFn: () => getBalanceHistory(walletId, from, to, interval),
    enabled: !!walletId && !!from && !!to,
    staleTime: ANALYTICS_STALE_TIME,
    // Known limitation: overlapping date ranges are not deduplicated.
    // Production fix: interval-aware cache or TimescaleDB continuous aggregates.
  });
}

export function useSpendingByCategory(
  walletId: string,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ["analytics", "spending", walletId, from, to],
    queryFn: () => mockGetSpendingByCategory(walletId),
    enabled: !!walletId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useAllTimeSummary(walletId: string) {
  const { data, isLoading } = useSpendingByCategory(walletId, "2000-01-01", new Date().toISOString().slice(0, 10));

  const inflowCents = data?.find((s) => s.transactionType === "DEPOSIT")?.totalCents ?? 0;
  const outflowCents =
    (data?.find((s) => s.transactionType === "WITHDRAW")?.totalCents ?? 0) +
    (data?.find((s) => s.transactionType === "TRANSFER")?.totalCents ?? 0);
  const netCents = inflowCents - outflowCents;
  const currency = "GBP";

  return { inflowCents, outflowCents, netCents, currency, isLoading };
}

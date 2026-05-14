"use client";

import { useQuery } from "@tanstack/react-query";
import { mockGetSpendingByCategory } from "@/lib/mocks/transaction";
import { mockGetBalanceHistory, mockGetMonthlySummary } from "@/lib/mocks/analytics";
import {
  getMonthlySummary,
  getBalanceHistory,
  getSpendingByCategory,
} from "@/lib/api/analytics";
import type { SpendingByCategory } from "@/lib/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const ANALYTICS_STALE_TIME = 5 * 60 * 1000;

export function useMonthlySummary(walletId: string, month: string) {
  return useQuery({
    queryKey: ["analytics", "summary", walletId, month],
    queryFn: () =>
      USE_MOCK
        ? mockGetMonthlySummary(walletId, month)
        : getMonthlySummary(walletId, month),
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
    queryFn: () =>
      USE_MOCK
        ? mockGetBalanceHistory(walletId, from, to, interval)
        : getBalanceHistory(walletId, from, to, interval),
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
    queryFn: () =>
      USE_MOCK
        ? mockGetSpendingByCategory(walletId, from, to)
        : getSpendingByCategory(walletId, from, to),
    enabled: !!walletId,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useAllTimeSummary(walletId: string, from: string) {
  const { data, isLoading } = useSpendingByCategory(walletId, from, new Date().toISOString().slice(0, 10));

  const inflowCents = data?.find((s) => s.transactionType === "DEPOSIT")?.totalCents ?? 0;
  const outflowCents =
    (data?.find((s) => s.transactionType === "WITHDRAW")?.totalCents ?? 0) +
    (data?.find((s) => s.transactionType === "TRANSFER")?.totalCents ?? 0);
  const netCents = inflowCents - outflowCents;
  const currency = "GBP";

  return { inflowCents, outflowCents, netCents, currency, isLoading };
}

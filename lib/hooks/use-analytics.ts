"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getBalanceHistory,
  getMonthlySummary,
  getSpendingByCategory,
} from "@/lib/api/analytics";

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
    queryFn: () => getSpendingByCategory(walletId, from, to),
    enabled: !!walletId && !!from && !!to,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

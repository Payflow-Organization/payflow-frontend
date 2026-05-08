import client from "./client";
import type {
  MonthlySummary,
  BalanceHistoryPoint,
  SpendingByCategory,
} from "@/lib/types";

export async function getMonthlySummary(
  walletId: string,
  month: string,
): Promise<MonthlySummary> {
  const res = await client.get<MonthlySummary>("/analytics/monthly-summary", {
    params: { walletId, month },
  });
  return res.data;
}

export async function getBalanceHistory(
  walletId: string,
  from: string,
  to: string,
  interval = "1 day",
): Promise<BalanceHistoryPoint[]> {
  const res = await client.get<BalanceHistoryPoint[]>(
    "/analytics/balance-history",
    {
      params: { walletId, from, to, interval },
    },
  );
  return res.data;
}

export async function getSpendingByCategory(
  walletId: string,
  from: string,
  to: string,
): Promise<SpendingByCategory[]> {
  const res = await client.get<SpendingByCategory[]>(
    "/analytics/spending-by-category",
    {
      params: { walletId, from, to },
    },
  );
  return res.data;
}

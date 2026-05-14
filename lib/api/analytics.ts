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

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadStatementCSV(
  walletId: string,
  from: string,
  to: string,
): Promise<void> {
  const res = await client.get<Blob>("/analytics/export/csv", {
    params: { walletId, from, to },
    responseType: "blob",
  });
  triggerBlobDownload(res.data, `statement-${from}-${to}.csv`);
}

export async function downloadStatementPDF(
  walletId: string,
  from: string,
  to: string,
): Promise<void> {
  const res = await client.get<Blob>("/analytics/export/pdf", {
    params: { walletId, from, to },
    responseType: "blob",
  });
  triggerBlobDownload(res.data, `statement-${from}-${to}.pdf`);
}

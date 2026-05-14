import type { BalanceHistoryPoint, MonthlySummary } from "@/lib/types";
import { getTransactionPool } from "@/lib/mocks/transaction";

export async function mockGetBalanceHistory(
  walletId: string,
  from: string,
  to: string,
  interval: string,
): Promise<BalanceHistoryPoint[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const pool = getTransactionPool(walletId).filter((tx) => tx.status === "SUCCESS");

  // Seed-based starting balance before the from-date
  const walletSeed = walletId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let balance = 40000 + (Math.abs(walletSeed) % 120000);

  // Apply all transactions that occurred before the from-date to reach correct starting balance
  const fromMs = new Date(from + "T00:00:00Z").getTime();
  for (const tx of pool) {
    if (new Date(tx.createdAt).getTime() < fromMs) {
      balance += tx.type === "DEPOSIT" ? tx.amount : -tx.amount;
    }
  }
  balance = Math.max(10000, balance);

  const points: BalanceHistoryPoint[] = [];
  let cur = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");

  while (cur <= end) {
    const nextCur =
      interval === "1 week"
        ? new Date(cur.getTime() + 7 * 86400000)
        : new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));

    for (const tx of pool) {
      const t = new Date(tx.createdAt).getTime();
      if (t >= cur.getTime() && t < nextCur.getTime()) {
        balance += tx.type === "DEPOSIT" ? tx.amount : -tx.amount;
        balance = Math.max(0, balance);
      }
    }

    points.push({ interval: cur.toISOString(), lastBalanceCents: balance });
    cur = nextCur;
  }

  return points;
}

export async function mockGetMonthlySummary(
  walletId: string,
  month: string,
): Promise<MonthlySummary> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const walletSeed = walletId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  // Use month epoch (days) so each month gets a distinct seed
  const monthSeed = Math.floor(new Date(month + "-01").getTime() / 86400000);
  const seed = Math.abs(walletSeed ^ monthSeed);

  const totalDepositsCents = 50000 + (seed * 7) % 250000;
  const totalWithdrawalsCents = 20000 + (seed * 13) % 180000;
  const transactionCount = 5 + seed % 45;

  return {
    totalDepositsCents,
    totalWithdrawalsCents,
    netCents: totalDepositsCents - totalWithdrawalsCents,
    transactionCount,
  };
}

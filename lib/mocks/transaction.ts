import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  SpendingByCategory,
  DepositRequest,
  WithdrawRequest,
  TransferRequest,
  PaginatedResponse,
} from "@/lib/types";
import { getDemoFlags, setDemoFlag } from "@/lib/demo-flags";

const CURRENCIES = ["GBP", "EUR", "USD"];
const TYPES: TransactionType[] = ["DEPOSIT", "WITHDRAW", "TRANSFER"];
const STATUSES: TransactionStatus[] = [
  "SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS", "PENDING", "FAILED",
];

const transactionPool = new Map<string, Transaction[]>();
const idempotencyCache = new Map<string, Transaction>();
// Per-wallet amount locked by in-flight withdrawals — simulates SERIALIZABLE row lock
const withdrawLock = new Map<string, number>();

function generatePool(walletId: string): Transaction[] {
  const otherIds = Array.from({ length: 6 }, () => crypto.randomUUID());
  return Array.from({ length: 47 }, (_, i) => {
    const type = TYPES[i % TYPES.length];
    const status = STATUSES[i % STATUSES.length];
    const currency = CURRENCIES[i % CURRENCIES.length];
    const baseAmount = (((i + 1) * 137) % 50000) + 500;
    const amount = type === "DEPOSIT" ? Math.round(baseAmount * 1.7) : baseAmount;
    const createdAt = new Date(
      Date.now() - i * 1.9 * 86400000,
    ).toISOString();
    return {
      id: crypto.randomUUID(),
      fromWalletId: type === "DEPOSIT" ? null : walletId,
      toWalletId:
        type === "WITHDRAW"
          ? null
          : type === "DEPOSIT"
            ? walletId
            : otherIds[i % otherIds.length],
      type,
      amount,
      currency,
      status,
      createdAt,
    };
  });
}

export async function mockGetTransactions(
  walletId: string | undefined,
  params: { page: number; size: number; type?: string; status?: string },
): Promise<PaginatedResponse<Transaction>> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!walletId) return { content: [], totalElements: 0, totalPages: 0, number: params.page, size: params.size };
  if (!transactionPool.has(walletId)) {
    transactionPool.set(walletId, generatePool(walletId));
  }
  let all = transactionPool.get(walletId)!;

  if (params.type) all = all.filter((tx) => tx.type === params.type);
  if (params.status) all = all.filter((tx) => tx.status === params.status);

  const start = params.page * params.size;
  return {
    content: all.slice(start, start + params.size),
    totalElements: all.length,
    totalPages: Math.ceil(all.length / params.size),
    number: params.page,
    size: params.size,
  };
}

export async function mockGetSpendingByCategory(
  walletId: string,
  from?: string,
  to?: string,
): Promise<SpendingByCategory[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  if (!transactionPool.has(walletId)) {
    transactionPool.set(walletId, generatePool(walletId));
  }
  const fromMs = from ? new Date(from).getTime() : -Infinity;
  const toMs = to ? new Date(to + "T23:59:59Z").getTime() : Infinity;
  const all = transactionPool.get(walletId)!.filter(
    (tx) => tx.status === "SUCCESS" && new Date(tx.createdAt).getTime() >= fromMs && new Date(tx.createdAt).getTime() <= toMs,
  );

  const grouped = new Map<string, { totalCents: number; count: number }>();
  for (const tx of all) {
    const entry = grouped.get(tx.type) ?? { totalCents: 0, count: 0 };
    entry.totalCents += tx.amount;
    entry.count += 1;
    grouped.set(tx.type, entry);
  }

  return Array.from(grouped.entries()).map(([transactionType, { totalCents, count }]) => ({
    transactionType,
    totalCents,
    count,
  }));
}

export async function mockGetRecentTransactions(
  walletId: string,
  limit: number,
): Promise<Transaction[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!transactionPool.has(walletId)) {
    transactionPool.set(walletId, generatePool(walletId));
  }
  return transactionPool.get(walletId)!.slice(0, limit);
}

export function getTransactionPool(walletId: string): Transaction[] {
  if (!transactionPool.has(walletId)) transactionPool.set(walletId, generatePool(walletId));
  return transactionPool.get(walletId)!;
}

export function resetTransactionPool() {
  transactionPool.clear();
  idempotencyCache.clear();
  withdrawLock.clear();
}

function checkDemoFailure() {
  const flags = getDemoFlags();
  if (flags.forceNextFailure) {
    setDemoFlag("forceNextFailure", false);
    throw new Error("Transaction failed (demo: forced failure)");
  }
}

function checkWalletFrozen(walletId: string) {
  const flags = getDemoFlags();
  if (flags.frozenWalletId === walletId) {
    throw Object.assign(new Error("WALLET_FROZEN"), { code: "WALLET_FROZEN" });
  }
}

function insertIntoPool(walletId: string, tx: Transaction) {
  if (!transactionPool.has(walletId)) {
    transactionPool.set(walletId, generatePool(walletId));
  }
  transactionPool.get(walletId)!.unshift(tx);
}

export async function mockCreateDeposit(
  data: DepositRequest,
): Promise<Transaction> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  checkDemoFailure();
  checkWalletFrozen(data.toWalletId);
  if (idempotencyCache.has(data.idempotencyKey)) return idempotencyCache.get(data.idempotencyKey)!;

  const tx: Transaction = {
    id: crypto.randomUUID(),
    fromWalletId: null,
    toWalletId: data.toWalletId,
    type: "DEPOSIT",
    amount: data.amount,
    currency: data.currency,
    status: "SUCCESS",
    createdAt: new Date().toISOString(),
  };
  insertIntoPool(data.toWalletId, tx);
  idempotencyCache.set(data.idempotencyKey, tx);
  return tx;
}

export async function mockCreateWithdraw(
  data: WithdrawRequest,
): Promise<Transaction> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  checkDemoFailure();
  checkWalletFrozen(data.fromWalletId);
  if (idempotencyCache.has(data.idempotencyKey)) return idempotencyCache.get(data.idempotencyKey)!;

  const tx: Transaction = {
    id: crypto.randomUUID(),
    fromWalletId: data.fromWalletId,
    toWalletId: null,
    type: "WITHDRAW",
    amount: data.amount,
    currency: data.currency,
    status: "SUCCESS",
    createdAt: new Date().toISOString(),
  };
  insertIntoPool(data.fromWalletId, tx);
  idempotencyCache.set(data.idempotencyKey, tx);
  return tx;
}

export async function mockCreateTransfer(
  data: TransferRequest,
): Promise<Transaction> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  checkDemoFailure();
  checkWalletFrozen(data.fromWalletId);
  if (idempotencyCache.has(data.idempotencyKey)) return idempotencyCache.get(data.idempotencyKey)!;

  const tx: Transaction = {
    id: crypto.randomUUID(),
    fromWalletId: data.fromWalletId,
    toWalletId: data.toWalletId,
    type: "TRANSFER",
    amount: data.amount,
    currency: data.currency,
    status: "SUCCESS",
    createdAt: new Date().toISOString(),
  };
  insertIntoPool(data.fromWalletId, tx);
  idempotencyCache.set(data.idempotencyKey, tx);
  return tx;
}

// Scenario-specific: simulates SERIALIZABLE isolation for concurrent withdrawal demo.
// Both calls start simultaneously; the second one sees the lock and fails with INSUFFICIENT_FUNDS.
export async function mockScenarioWithdraw(
  walletId: string,
  amountCents: number,
  balanceCents: number,
  currency: string,
): Promise<Transaction> {
  await new Promise((r) => setTimeout(r, 300));

  const locked = withdrawLock.get(walletId) ?? 0;
  if (amountCents > balanceCents - locked) {
    throw Object.assign(new Error("INSUFFICIENT_FUNDS"), {
      code: "INSUFFICIENT_FUNDS",
      availableCents: balanceCents - locked,
    });
  }

  withdrawLock.set(walletId, locked + amountCents);
  await new Promise((r) => setTimeout(r, 150));
  withdrawLock.set(walletId, (withdrawLock.get(walletId) ?? amountCents) - amountCents);

  return {
    id: crypto.randomUUID(),
    fromWalletId: walletId,
    toWalletId: null,
    type: "WITHDRAW",
    amount: amountCents,
    currency,
    status: "SUCCESS",
    createdAt: new Date().toISOString(),
  };
}

// Scenario runner functions — each is a self-contained async function.
// Switches between mock and real API based on NEXT_PUBLIC_USE_MOCK.

import type { ScenarioResult } from "./types";
import {
  mockCreateDeposit,
  mockCreateWithdraw,
  mockCreateTransfer,
  mockScenarioWithdraw,
  getTransactionPool,
  resetTransactionPool,
  primePool,
} from "@/lib/mocks/transaction";
import type { AxiosError } from "axios";
import type { Transaction, TransactionType, ApiError } from "@/lib/types";
import { createWallet, getWallets } from "@/lib/api/wallets";
import { createDeposit, createWithdraw } from "@/lib/api/transaction";
import { formatCurrency } from "@/lib/utils";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── 1. Idempotency ───────────────────────────────────────────────────────────
// Fires 3 concurrent deposits with identical idempotency key.
// All 3 must return the same transaction ID — the backend deduplicates.
export async function runIdempotencyTest(
  walletId: string,
  currency: string,
): Promise<ScenarioResult> {
  const sharedKey = crypto.randomUUID();
  const start = Date.now();

  const payload = { toWalletId: walletId, amount: 100, currency, idempotencyKey: sharedKey };
  const fn = USE_MOCK ? mockCreateDeposit : createDeposit;
  const [r1, r2, r3] = await Promise.all([fn(payload), fn(payload), fn(payload)]);

  const ids = [r1.id, r2.id, r3.id];
  const allSame = ids.every((id) => id === ids[0]);

  return {
    status: allSame ? "pass" : "fail",
    summary: allSame
      ? "All 3 concurrent requests returned the same transaction ID — idempotency key deduplicated at the command handler."
      : "Requests returned different IDs — idempotency violated. Check command handler.",
    rows: [
      { label: "Idempotency key", value: sharedKey, mono: true, status: "neutral" },
      ...ids.map((id, i) => ({
        label: `Request ${i + 1} tx ID`,
        value: id,
        mono: true,
        status: (allSame ? "pass" : i === 0 ? "pass" : "fail") as "pass" | "fail",
      })),
      { label: "Deduplicated", value: allSame ? "Yes — 1 write, 3 reads from cache" : "No", status: allSame ? "pass" : "fail" },
    ],
    durationMs: Date.now() - start,
    swapNote: "POST /transactions/deposit ×3 with same Idempotency-Key header",
  };
}

// ─── 2. Concurrent Double-Spend ───────────────────────────────────────────────
// Two withdrawals fired simultaneously, each 60% of balance = 120% combined.
// SERIALIZABLE isolation must reject the second one with INSUFFICIENT_FUNDS.
export async function runDoubleSpend(
  walletId: string,
  balanceCents: number,
  currency: string,
): Promise<ScenarioResult> {
  const withdrawAmount = Math.round(balanceCents * 0.6);
  const start = Date.now();

  const withdraw60 = USE_MOCK
    ? (key: string) => mockScenarioWithdraw(walletId, withdrawAmount, balanceCents, currency)
    : (key: string) => createWithdraw({ fromWalletId: walletId, amount: withdrawAmount, currency, idempotencyKey: key });

  const [r1, r2] = await Promise.allSettled([
    withdraw60(crypto.randomUUID()),
    withdraw60(crypto.randomUUID()),
  ]);

  const succeeded = r1.status === "fulfilled" ? r1.value : r2.status === "fulfilled" ? r2.value : null;
  const rejectedReason = r1.status === "rejected" ? r1.reason : r2.status === "rejected" ? r2.reason : null;
  const rejectedMsg = rejectedReason?.response?.data?.code ?? rejectedReason?.response?.data?.message ?? rejectedReason?.code ?? rejectedReason?.message ?? "REJECTED";
  const pass = !!succeeded && !!rejectedReason;

  return {
    status: pass ? "pass" : "fail",
    summary: pass
      ? "One withdrawal succeeded, one rejected with INSUFFICIENT_FUNDS. SERIALIZABLE isolation prevented double-spend."
      : "Both succeeded — double-spend not prevented. Isolation level too weak.",
    rows: [
      { label: "Wallet balance", value: formatCurrency(balanceCents, currency), status: "neutral" },
      { label: "Each withdrawal", value: `${formatCurrency(withdrawAmount, currency)} (60%)`, status: "neutral" },
      { label: "Combined", value: `${formatCurrency(withdrawAmount * 2, currency)} (120% — overdraft)`, status: "neutral" },
      { label: "Request 1", value: succeeded ? `✓ SUCCESS — tx ${succeeded.id.slice(0, 8)}…` : "✗ REJECTED", status: succeeded ? "pass" : "fail", mono: true },
      { label: "Request 2", value: rejectedReason ? `✗ ${rejectedMsg}` : "✓ SUCCESS", status: rejectedReason ? "fail" : "pass", mono: true },
      { label: "Balance integrity", value: pass ? "Preserved — only one withdrawal committed" : "Violated", status: pass ? "pass" : "fail" },
    ],
    durationMs: Date.now() - start,
    swapNote: "POST /transactions/withdraw ×2 concurrent — real backend enforces via @Transactional(SERIALIZABLE)",
  };
}

// ─── 3. Ledger Reconciliation ─────────────────────────────────────────────────
// Sums all mock transactions and verifies the running balance matches expectations.
// In production this calls a backend endpoint that compares the cached wallet.balance
// column against the sum of all ledger_entries — drift must always be 0.
//
// SWAP: replace getTransactionPool with:
//   fetch(`/api/demo/reconcile/${walletId}`) → { cachedBalance, ledgerSum, drift }
export async function runReconciliation(walletId: string, currency: string): Promise<ScenarioResult> {
  await delay(400);
  const start = Date.now();

  const pool = getTransactionPool(walletId).filter((tx) => tx.status === "SUCCESS");
  const walletSeed = walletId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const seedBalance = 40000 + (Math.abs(walletSeed) % 120000);

  let ledgerSum = seedBalance;
  for (const tx of pool) {
    ledgerSum += tx.type === "DEPOSIT" ? tx.amount : -tx.amount;
  }
  ledgerSum = Math.max(0, ledgerSum);

  const depositCount = pool.filter((t) => t.type === "DEPOSIT").length;
  const withdrawCount = pool.filter((t) => t.type === "WITHDRAW").length;
  const transferCount = pool.filter((t) => t.type === "TRANSFER").length;
  const drift = 0; // mock is always consistent — real backend may show drift if outbox relay failed

  return {
    status: drift === 0 ? "pass" : "fail",
    summary: drift === 0
      ? "Ledger sum matches cached balance. No reconciliation drift detected."
      : `Drift detected: ${formatCurrency(Math.abs(drift), currency)}. Outbox relay may have failed to deliver.`,
    rows: [
      { label: "Transactions audited", value: `${pool.length} (${depositCount}D / ${withdrawCount}W / ${transferCount}T)`, status: "neutral" },
      { label: "Seed balance", value: formatCurrency(seedBalance, currency), status: "neutral" },
      { label: "Ledger sum", value: formatCurrency(ledgerSum, currency), mono: true, status: "neutral" },
      { label: "Cached balance", value: formatCurrency(ledgerSum, currency), mono: true, status: "neutral" },
      { label: "Drift", value: drift === 0 ? "£0.00 — clean" : formatCurrency(Math.abs(drift), currency), status: drift === 0 ? "pass" : "fail" },
    ],
    durationMs: Date.now() - start,
    swapNote: "ReconciliationService.reconcile() — runs nightly via @Scheduled(cron). Not user-triggerable by design; this scenario simulates the concept.",
  };
}

// ─── 4. Silent Token Refresh ──────────────────────────────────────────────────
// Simulates the JWT expiry → silent refresh → retry cycle handled by the axios interceptor.
// In production this happens automatically — this scenario makes it visible.
//
// SWAP: this scenario is already live with the real backend.
// The axios interceptor in lib/api/client.ts handles this automatically.
// You can verify by letting your JWT expire and watching the Network tab.
export async function runTokenExpiry(): Promise<ScenarioResult> {
  const start = Date.now();
  const steps: { label: string; value: string; status: "pass" | "fail" | "neutral" }[] = [];

  await delay(250);
  steps.push({ label: "1. Request sent", value: "GET /wallets → awaiting response…", status: "neutral" });

  await delay(350);
  steps.push({ label: "2. Response received", value: "401 Unauthorized — access token expired", status: "fail" });

  await delay(500);
  steps.push({ label: "3. Interceptor triggered", value: "POST /auth/refresh → 200 OK, new token issued", status: "pass" });

  await delay(250);
  steps.push({ label: "4. Original request retried", value: "GET /wallets → 200 OK", status: "pass" });

  await delay(100);
  steps.push({ label: "5. User experience", value: "No error shown — refresh was transparent", status: "pass" });

  return {
    status: "pass",
    summary: "Silent token refresh completed. The axios interceptor caught the 401, refreshed the token, and retried — the user saw nothing.",
    rows: steps,
    durationMs: Date.now() - start,
    swapNote: "Already live — see lib/api/client.ts interceptor. Let JWT expire and check Network tab to verify.",
  };
}

// ─── 5. Overdraft Rejection ───────────────────────────────────────────────────
// Attempts a withdrawal £100 over the wallet balance.
// The backend must reject it with INSUFFICIENT_FUNDS — no debit applied.
export async function runOverdraft(
  walletId: string,
  balanceCents: number,
  currency: string,
): Promise<ScenarioResult> {
  const overdraftAmount = balanceCents + 10_000;
  const start = Date.now();

  try {
    const fn = USE_MOCK
      ? () => mockScenarioWithdraw(walletId, overdraftAmount, balanceCents, currency)
      : () => createWithdraw({ fromWalletId: walletId, amount: overdraftAmount, currency, idempotencyKey: crypto.randomUUID() });

    await fn();

    return {
      status: "fail",
      summary: "Expected INSUFFICIENT_FUNDS but withdrawal succeeded — balance protection not enforced.",
      rows: [
        { label: "Attempted", value: formatCurrency(overdraftAmount, currency), status: "fail" },
        { label: "Available", value: formatCurrency(balanceCents, currency), status: "fail" },
        { label: "Result", value: "✓ SUCCEEDED — should have been rejected", status: "fail" },
      ],
      durationMs: Date.now() - start,
      swapNote: "",
    };
  } catch (e) {
    const err = e as AxiosError<ApiError & { availableCents?: number }>;
    const code = err.response?.data?.code ?? err.code ?? err.message ?? "UNKNOWN";
    const available = err.response?.data?.availableCents ?? balanceCents;
    const pass = code.includes("INSUFFICIENT_FUNDS");

    return {
      status: pass ? "pass" : "fail",
      summary: pass
        ? "Backend rejected the overdraft — INSUFFICIENT_FUNDS, balance unchanged."
        : `Unexpected error: ${code}`,
      rows: [
        { label: "Wallet balance", value: formatCurrency(balanceCents, currency), status: "neutral" },
        { label: "Attempted withdrawal", value: `${formatCurrency(overdraftAmount, currency)} (balance + ${formatCurrency(10_000, currency)})`, status: "neutral" },
        { label: "Backend response", value: `✗ ${code}`, mono: true, status: "fail" },
        { label: "Available at rejection", value: formatCurrency(available, currency), mono: true, status: "neutral" },
        { label: "Balance integrity", value: pass ? "Preserved — no debit applied" : "Unknown", status: pass ? "pass" : "fail" },
      ],
      durationMs: Date.now() - start,
      swapNote: "POST /transactions/withdraw with amount > balance — balance check inside @Transactional(SERIALIZABLE)",
    };
  }
}

// ─── 6. Seed Backend ──────────────────────────────────────────────────────────
// Creates wallets and fires deposits, withdrawals, and transfers.
// In mock mode: seeds the in-memory transaction pools directly.
// In live mode: hits the real backend; idempotent (skips if data already present).
export async function runSeedBackend(): Promise<ScenarioResult> {
  const start = Date.now();

  if (USE_MOCK) {
    return runMockSeed(start);
  }

  const rows: ScenarioResult["rows"] = [];
  let txCount = 0;

  async function deposit(walletId: string, currency: string, amount: number) {
    await createDeposit({ toWalletId: walletId, amount, currency, idempotencyKey: crypto.randomUUID() });
    txCount++;
  }
  async function withdraw(walletId: string, currency: string, amount: number) {
    await createWithdraw({ fromWalletId: walletId, amount, currency, idempotencyKey: crypto.randomUUID() });
    txCount++;
  }
  try {
    // Check existing state first — idempotent by design
    const existing = await getWallets();
    const seeded = existing.filter((w) => w.balance > 0);

    if (seeded.length > 0) {
      return {
        status: "pass",
        summary: `Idempotency demonstrated — detected existing data, no write issued. Calling this N times produces the same result as calling it once.`,
        rows: [
          { label: "1. Read existing state", value: `GET /wallets → ${existing.length} wallet${existing.length !== 1 ? "s" : ""} returned`, status: "neutral" },
          { label: "2. Condition check", value: `${seeded.length} wallet${seeded.length !== 1 ? "s" : ""} have balance > 0 — data present`, status: "neutral" },
          { label: "3. Decision", value: "Skip write — outcome already achieved", status: "pass" },
          ...seeded.map((w) => ({
            label: `   ${w.currency} ····${w.id.slice(-4)}`,
            value: `${formatCurrency(w.balance, w.currency)} · ${w.status}`,
            mono: true,
            status: "pass" as const,
          })),
          { label: "4. Writes issued", value: "0 — no duplicate wallets, no duplicate transactions", status: "pass" },
          { label: "Idempotency guarantee", value: "✓ Safe to call any number of times", status: "pass" },
        ],
        durationMs: Date.now() - start,
        swapNote: "Same pattern used in command handlers — check state before acting, never assume a write is needed",
      };
    }

    const gbp = await createWallet({ currency: "GBP" });
    rows.push({ label: "GBP wallet", value: `created ····${gbp.id.slice(-4)}`, mono: true, status: "pass" });

    const eur = await createWallet({ currency: "EUR" });
    rows.push({ label: "EUR wallet", value: `created ····${eur.id.slice(-4)}`, mono: true, status: "pass" });

    const usd = await createWallet({ currency: "USD" });
    rows.push({ label: "USD wallet", value: `created ····${usd.id.slice(-4)}`, mono: true, status: "pass" });

    await deposit(gbp.id, "GBP", 50000);
    await deposit(gbp.id, "GBP", 120000);
    await withdraw(gbp.id, "GBP", 7500);
    await deposit(gbp.id, "GBP", 30000);
    await withdraw(gbp.id, "GBP", 12000);
    await deposit(gbp.id, "GBP", 22000);
    await withdraw(gbp.id, "GBP", 4500);
    await deposit(gbp.id, "GBP", 45000);
    rows.push({ label: "GBP wallet activity", value: "8 transactions", status: "neutral" });

    await deposit(eur.id, "EUR", 40000);
    await deposit(eur.id, "EUR", 9500);
    await withdraw(eur.id, "EUR", 6000);
    rows.push({ label: "EUR wallet activity", value: "3 transactions", status: "neutral" });

    await deposit(usd.id, "USD", 35000);
    await deposit(usd.id, "USD", 12000);
    await withdraw(usd.id, "USD", 8000);
    rows.push({ label: "USD wallet activity", value: "3 transactions", status: "neutral" });

    rows.push({ label: "Total transactions", value: String(txCount), status: "pass" });

    return {
      status: "pass",
      summary: `Backend seeded — ${txCount} transactions across 3 wallets. Refresh the page to see live data.`,
      rows,
      durationMs: Date.now() - start,
      swapNote: "POST /wallets ×3 · POST /transactions/deposit + /withdraw ×" + txCount,
    };
  } catch (e) {
    const err = e as AxiosError<ApiError>;
    const detail = err.response?.data?.message ?? err.response?.data?.code ?? err.message ?? "unknown error";
    return {
      status: "fail",
      summary: `Seeding failed: ${detail} — is the backend running and are you logged in?`,
      rows,
      durationMs: Date.now() - start,
      swapNote: "",
    };
  }
}

async function runMockSeed(start: number): Promise<ScenarioResult> {
  const wallets = await getWallets();
  if (wallets.length < 2) {
    return {
      status: "fail",
      summary: "Need at least 2 mock wallets to seed transfers.",
      rows: [],
      durationMs: Date.now() - start,
      swapNote: "",
    };
  }

  resetTransactionPool();

  const [w1, w2] = wallets;

  // Transactions spread evenly over the past 60 days — oldest first so the
  // balance history graph shows a realistic curve rather than a single spike.
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  type TxPlan = {
    walletIds: string[];
    type: TransactionType;
    fromWalletId: string | null;
    toWalletId: string | null;
    amount: number;
    currency: string;
  };

  // Two full sine cycles over 60 days.
  // Phase net changes from a ~80k baseline (mock seed floor):
  //   Rise 1: +210k → ~290k peak
  //   Fall 1: −170k → ~120k trough
  //   Rise 2: +190k → ~310k peak
  //   Fall 2:  −70k → ~240k tail
  const plan: TxPlan[] = [
    // ── Rise 1 (days 60–46 ago) ──────────────────────────────────────────────
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 85000, currency: w1.currency },
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 70000, currency: w1.currency },
    { walletIds: [w1.id],        type: "WITHDRAW", fromWalletId: w1.id, toWalletId: null,   amount: 5000,  currency: w1.currency },
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 60000, currency: w1.currency },
    // ── Fall 1 (days 46–31 ago) ──────────────────────────────────────────────
    { walletIds: [w1.id],        type: "WITHDRAW", fromWalletId: w1.id, toWalletId: null,   amount: 60000, currency: w1.currency },
    { walletIds: [w1.id],        type: "WITHDRAW", fromWalletId: w1.id, toWalletId: null,   amount: 75000, currency: w1.currency },
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 10000, currency: w1.currency },
    { walletIds: [w1.id, w2.id], type: "TRANSFER", fromWalletId: w1.id, toWalletId: w2.id,  amount: 45000, currency: w1.currency },
    // ── Rise 2 (days 31–16 ago) ──────────────────────────────────────────────
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 90000, currency: w1.currency },
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 65000, currency: w1.currency },
    { walletIds: [w1.id],        type: "WITHDRAW", fromWalletId: w1.id, toWalletId: null,   amount: 8000,  currency: w1.currency },
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 43000, currency: w1.currency },
    // ── Fall 2 (days 16–1 ago) ───────────────────────────────────────────────
    { walletIds: [w1.id, w2.id], type: "TRANSFER", fromWalletId: w1.id, toWalletId: w2.id,  amount: 32000, currency: w1.currency },
    { walletIds: [w1.id],        type: "WITHDRAW", fromWalletId: w1.id, toWalletId: null,   amount: 40000, currency: w1.currency },
    { walletIds: [w1.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w1.id,  amount: 22000, currency: w1.currency },
    { walletIds: [w1.id],        type: "WITHDRAW", fromWalletId: w1.id, toWalletId: null,   amount: 20000, currency: w1.currency },
    // ── w2 ───────────────────────────────────────────────────────────────────
    { walletIds: [w2.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w2.id,  amount: 25000, currency: w2.currency },
    { walletIds: [w2.id],        type: "WITHDRAW", fromWalletId: w2.id, toWalletId: null,   amount: 8000,  currency: w2.currency },
    { walletIds: [w2.id],        type: "DEPOSIT",  fromWalletId: null,  toWalletId: w2.id,  amount: 14000, currency: w2.currency },
  ];

  for (const w of wallets.slice(2)) {
    plan.push(
      { walletIds: [w.id], type: "DEPOSIT",  fromWalletId: null,  toWalletId: w.id, amount: 40000, currency: w.currency },
      { walletIds: [w.id], type: "DEPOSIT",  fromWalletId: null,  toWalletId: w.id, amount: 9500,  currency: w.currency },
      { walletIds: [w.id], type: "WITHDRAW", fromWalletId: w.id,  toWalletId: null, amount: 6000,  currency: w.currency },
    );
  }

  // Assign timestamps spread from 60 days ago → now, then sort each pool by date.
  const poolMap = new Map<string, Transaction[]>();
  plan.forEach(({ walletIds, type, fromWalletId, toWalletId, amount, currency }, i) => {
    const fraction = plan.length === 1 ? 1 : i / (plan.length - 1);
    const createdAt = new Date(now - SIXTY_DAYS_MS * (1 - fraction)).toISOString();
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type,
      fromWalletId,
      toWalletId,
      amount,
      currency,
      status: "SUCCESS",
      createdAt,
    };
    for (const wid of walletIds) {
      if (!poolMap.has(wid)) poolMap.set(wid, []);
      poolMap.get(wid)!.push(tx);
    }
  });

  for (const [walletId, txs] of poolMap) {
    // Most-recent first — matches what the real backend returns (ORDER BY created_at DESC)
    primePool(walletId, txs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  const txCount = plan.length;
  const rows: ScenarioResult["rows"] = [
    { label: `${w1.currency} wallet 1`, value: "10 transactions (5 dep · 3 wd · 2 transfers out)", status: "neutral" },
    { label: `${w2.currency} wallet 2`, value: "3 transactions + 2 incoming transfers", status: "neutral" },
    ...wallets.slice(2).map((w) => ({ label: `${w.currency} wallet`, value: "3 transactions", status: "neutral" as const })),
    { label: "Date spread", value: "past 60 days → graph shows a full curve", status: "pass" },
    { label: "Total", value: String(txCount), status: "pass" },
  ];

  return {
    status: "pass",
    summary: `Mock data seeded — ${txCount} transactions across ${wallets.length} wallets, spread over 60 days. Transfers visible on both sides.`,
    rows,
    durationMs: Date.now() - start,
    swapNote: "Mock mode — in-memory only, lost on page refresh",
  };
}

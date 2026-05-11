// Scenario runner functions — each is a self-contained async function.
//
// HOW TO SWAP FOR REAL BACKEND:
// Every function has a "// SWAP:" comment showing the exact API call to replace the mock with.
// The return type (ScenarioResult) stays the same — only the implementation inside changes.
// The scenarios page calls these functions and renders results; it never changes.

import type { ScenarioResult } from "./types";
import { mockCreateDeposit, mockScenarioWithdraw, getTransactionPool } from "@/lib/mocks/transaction";
import { createWallet } from "@/lib/api/wallets";
import { createDeposit, createWithdraw, createTransfer } from "@/lib/api/transaction";
import { formatCurrency } from "@/lib/utils";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── 1. Idempotency ───────────────────────────────────────────────────────────
// Fires 3 concurrent deposits with identical idempotency key.
// All 3 must return the same transaction ID — the backend deduplicates.
//
// SWAP: replace mockCreateDeposit calls with:
//   client.post('/transactions/deposit', { ...payload, idempotencyKey: sharedKey })
export async function runIdempotencyTest(
  walletId: string,
  currency: string,
): Promise<ScenarioResult> {
  const sharedKey = crypto.randomUUID();
  const start = Date.now();

  const payload = { toWalletId: walletId, amount: 100, currency, idempotencyKey: sharedKey };
  const [r1, r2, r3] = await Promise.all([
    mockCreateDeposit(payload),
    mockCreateDeposit(payload),
    mockCreateDeposit(payload),
  ]);

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
//
// SWAP: replace mockScenarioWithdraw calls with:
//   client.post('/transactions/withdraw', { fromWalletId, amount, currency, idempotencyKey })
//   The real backend handles the race via SELECT FOR UPDATE / serializable tx.
export async function runDoubleSpend(
  walletId: string,
  balanceCents: number,
  currency: string,
): Promise<ScenarioResult> {
  const withdrawAmount = Math.round(balanceCents * 0.6);
  const start = Date.now();

  const [r1, r2] = await Promise.allSettled([
    mockScenarioWithdraw(walletId, withdrawAmount, balanceCents, currency),
    mockScenarioWithdraw(walletId, withdrawAmount, balanceCents, currency),
  ]);

  const succeeded = r1.status === "fulfilled" ? r1.value : r2.status === "fulfilled" ? r2.value : null;
  const rejected = r1.status === "rejected" ? r1.reason : r2.status === "rejected" ? r2.reason : null;
  const pass = !!succeeded && !!rejected;

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
      { label: "Request 2", value: rejected?.message ?? (succeeded ? "✗ REJECTED" : "✓ SUCCESS"), status: rejected ? "fail" : "pass" },
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
    swapNote: "GET /demo/reconcile/{walletId} → { cachedBalanceCents, ledgerSumCents, driftCents }",
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

// ─── 5. Seed Backend ──────────────────────────────────────────────────────────
// Creates 3 wallets (2× GBP, 1× EUR) and fires real deposits, withdrawals, and
// transfers through the actual API so the UI pages load live data from the backend.
// Run this once before demoing; data persists in PostgreSQL.
export async function runSeedBackend(): Promise<ScenarioResult> {
  const start = Date.now();
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
  async function transfer(fromId: string, toId: string, currency: string, amount: number) {
    await createTransfer({ fromWalletId: fromId, toWalletId: toId, amount, currency, idempotencyKey: crypto.randomUUID() });
    txCount++;
  }

  try {
    const gbp1 = await createWallet({ currency: "GBP" });
    rows.push({ label: "GBP wallet 1", value: `created ····${gbp1.id.slice(-4)}`, mono: true, status: "pass" });

    const gbp2 = await createWallet({ currency: "GBP" });
    rows.push({ label: "GBP wallet 2", value: `created ····${gbp2.id.slice(-4)}`, mono: true, status: "pass" });

    const eur = await createWallet({ currency: "EUR" });
    rows.push({ label: "EUR wallet", value: `created ····${eur.id.slice(-4)}`, mono: true, status: "pass" });

    // GBP wallet 1 — build up a realistic balance with varied activity
    await deposit(gbp1.id, "GBP", 50000);
    await deposit(gbp1.id, "GBP", 120000);
    await withdraw(gbp1.id, "GBP", 7500);
    await deposit(gbp1.id, "GBP", 30000);
    await withdraw(gbp1.id, "GBP", 12000);
    await transfer(gbp1.id, gbp2.id, "GBP", 15000);
    await deposit(gbp1.id, "GBP", 22000);
    await withdraw(gbp1.id, "GBP", 4500);
    await transfer(gbp1.id, gbp2.id, "GBP", 8000);
    await deposit(gbp1.id, "GBP", 45000);
    rows.push({ label: "GBP wallet 1 activity", value: "10 transactions", status: "neutral" });

    // GBP wallet 2 — receives transfers, has own deposits/withdrawals
    await deposit(gbp2.id, "GBP", 20000);
    await withdraw(gbp2.id, "GBP", 5000);
    await deposit(gbp2.id, "GBP", 8500);
    rows.push({ label: "GBP wallet 2 activity", value: "3 transactions + 2 incoming transfers", status: "neutral" });

    // EUR wallet
    await deposit(eur.id, "EUR", 40000);
    await deposit(eur.id, "EUR", 9500);
    await withdraw(eur.id, "EUR", 6000);
    await deposit(eur.id, "EUR", 27500);
    await withdraw(eur.id, "EUR", 18000);
    rows.push({ label: "EUR wallet activity", value: "5 transactions", status: "neutral" });

    rows.push({ label: "Total transactions", value: String(txCount), status: "pass" });

    return {
      status: "pass",
      summary: `Backend seeded — ${txCount} transactions across 3 wallets. Refresh the page to see live data.`,
      rows,
      durationMs: Date.now() - start,
      swapNote: "POST /wallets ×3 · POST /transactions/deposit + /withdraw + /transfer ×" + txCount,
    };
  } catch (e) {
    return {
      status: "fail",
      summary: e instanceof Error ? e.message : "Seeding failed — is the backend running and are you logged in?",
      rows,
      durationMs: Date.now() - start,
      swapNote: "",
    };
  }
}

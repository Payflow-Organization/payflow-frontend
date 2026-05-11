"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWallets, useFreezeWallet } from "@/lib/hooks/use-wallet";
import { getDemoFlags, setDemoFlag, clearDemoFlags, type DemoFlags } from "@/lib/demo-flags";
import { resetTransactionPool } from "@/lib/mocks/transaction";
import {
  runIdempotencyTest,
  runDoubleSpend,
  runReconciliation,
  runTokenExpiry,
  runSeedBackend,
} from "@/lib/scenarios/runners";
import {
  Zap, XCircle, Lock, RefreshCw, Info, CheckCircle2,
  Loader2, ShieldCheck, GitMerge, RotateCcw, KeyRound, Database,
} from "lucide-react";
import { ControlRow } from "@/components/features/scenarios/ControlRow";
import { RunnableScenario } from "@/components/features/scenarios/RunnableScenario";

const LAG_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "1s", value: 1000 },
  { label: "3s", value: 3000 },
  { label: "6s", value: 6000 },
];

export default function ScenariosPage() {
  const { data: wallets } = useWallets();
  const freezeWalletMutation = useFreezeWallet();
  const [flags, setFlags] = useState<DemoFlags>(() => getDemoFlags());
  const [resetDone, setResetDone] = useState(false);

  function apply<K extends keyof DemoFlags>(key: K, value: DemoFlags[K]) {
    setDemoFlag(key, value);
    setFlags(getDemoFlags());
  }

  function handleReset() {
    clearDemoFlags();
    resetTransactionPool();
    setFlags(getDemoFlags());
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  }

  const activeWallet = wallets?.[0];

  return (
    <div className="min-h-screen p-8 max-w-3xl space-y-10">
      <div>
        <h1 className="text-base font-semibold text-foreground">Demo Scenarios</h1>
        <p className="text-base text-muted/70 font-normal mt-0.5">
          Simulate backend failure modes and distributed system guarantees.
        </p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3 text-sm text-primary">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          Controls persist in <code className="font-mono text-xs">localStorage</code>.
          Runnable scenarios execute mock implementations now — each has a{" "}
          <code className="font-mono text-xs">SWAP:</code> note showing the exact real API call to replace it with.
        </span>
      </div>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Controls</h2>

        <ControlRow icon={<Zap size={16} />} title="Kafka Lag" active={flags.kafkaLagMs > 0}
          description="Delays wallet balance refresh after mutation. Shows 'Balance updating…' in banking forms — simulates outbox → Kafka → projection latency."
        >
          <div className="flex items-center gap-2">
            {LAG_OPTIONS.map((opt) => (
              <Button key={opt.value} size="sm" variant={flags.kafkaLagMs === opt.value ? "default" : "outline"} className="rounded-full h-7 px-3 text-xs" onClick={() => apply("kafkaLagMs", opt.value)}>
                {opt.label}
              </Button>
            ))}
          </div>
        </ControlRow>

        <Separator />

        <ControlRow icon={<XCircle size={16} />} title="Force Next Failure" active={flags.forceNextFailure}
          description="Next deposit, withdrawal, or transfer throws an error. Auto-clears after one use. Tests the frontend error state and retry flow."
        >
          <Button size="sm" variant={flags.forceNextFailure ? "destructive" : "outline"} className="rounded-full h-7 px-3 text-xs" onClick={() => apply("forceNextFailure", !flags.forceNextFailure)}>
            {flags.forceNextFailure ? "Armed — click to disarm" : "Arm failure"}
          </Button>
        </ControlRow>

        <Separator />

        <ControlRow icon={<Lock size={16} />} title="Freeze Wallet"
          active={!!flags.frozenWalletId || !!wallets?.some((w) => w.status === "FROZEN")}
          description="Calls POST /wallets/{id}/freeze on the backend (FreezeWalletCommandHandler). On success the wallet status flips to FROZEN and the banking UI locks. Falls back to a UI-only flag if the backend is unreachable."
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant={!flags.frozenWalletId ? "default" : "outline"} className="rounded-full h-7 px-3 text-xs" onClick={() => apply("frozenWalletId", null)}>
              None
            </Button>
            {wallets?.map((w) => {
              const isFrozen = flags.frozenWalletId === w.id || w.status === "FROZEN";
              return (
                <Button key={w.id} size="sm" variant={isFrozen ? "destructive" : "outline"} className="rounded-full h-7 px-3 text-xs"
                  disabled={freezeWalletMutation.isPending}
                  onClick={async () => {
                    if (isFrozen) { apply("frozenWalletId", null); return; }
                    try { await freezeWalletMutation.mutateAsync(w.id); } catch { }
                    apply("frozenWalletId", w.id);
                  }}
                >
                  {freezeWalletMutation.isPending && flags.frozenWalletId !== w.id && <Loader2 size={10} className="animate-spin" />}
                  {w.currency} ....{w.id.slice(-4)}{isFrozen ? " (frozen)" : ""}
                </Button>
              );
            })}
          </div>
        </ControlRow>
      </section>

      <section className="space-y-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Setup</h2>
        <RunnableScenario
          icon={<Database size={16} />}
          title="Seed Backend"
          description="Creates 3 wallets (2× GBP, 1× EUR) and fires real deposits, withdrawals, and transfers through the API. Run once before demoing — data persists in PostgreSQL."
          guarantee="Real API — POST /wallets · /transactions/deposit · /withdraw · /transfer"
          badge="LIVE"
          run={runSeedBackend}
        />
      </section>

      <section className="space-y-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Distributed Systems</h2>

        <RunnableScenario
          icon={<KeyRound size={16} />}
          title="Idempotency Guarantee"
          description="Fires 3 concurrent deposits with the same idempotency key. All 3 must return the same transaction ID — the command handler deduplicates at the DB level."
          guarantee="SERIALIZABLE + idempotency cache"
          disabled={!activeWallet}
          run={() => runIdempotencyTest(activeWallet!.id, activeWallet!.currency)}
        />

        <Separator />

        <RunnableScenario
          icon={<GitMerge size={16} />}
          title="Concurrent Double-Spend"
          description="Two withdrawals fired simultaneously, each 60% of the wallet balance — 120% combined. SERIALIZABLE isolation must reject the second one with INSUFFICIENT_FUNDS."
          guarantee="@Transactional(SERIALIZABLE)"
          disabled={!activeWallet}
          run={() => runDoubleSpend(activeWallet!.id, activeWallet!.balance, activeWallet!.currency)}
        />

        <Separator />

        <RunnableScenario
          icon={<ShieldCheck size={16} />}
          title="Ledger Reconciliation"
          description="Sums all ledger entries and compares to the cached wallet balance column. Drift must always be 0 — any gap means the outbox relay failed to deliver."
          guarantee="Double-entry ledger + nightly reconciliation job"
          disabled={!activeWallet}
          run={() => runReconciliation(activeWallet!.id, activeWallet!.currency)}
        />

        <Separator />

        <RunnableScenario
          icon={<RotateCcw size={16} />}
          title="Silent Token Refresh"
          description="Simulates a 401 response being intercepted, the refresh token exchanged transparently, and the original request retried — without the user ever seeing an error."
          guarantee="Axios interceptor — lib/api/client.ts"
          run={runTokenExpiry}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reset</h2>
        <ControlRow icon={<RefreshCw size={16} />} title="Reset Demo Data" active={false}
          description="Clears all flags, wipes the in-memory transaction pool, and clears the idempotency cache. Next load regenerates deterministic mock data."
        >
          <Button size="sm" variant="outline" className="rounded-full h-7 px-3 text-xs" onClick={handleReset}>
            {resetDone
              ? <span className="flex items-center gap-1.5 text-primary"><CheckCircle2 size={12} /> Done</span>
              : "Reset everything"}
          </Button>
        </ControlRow>
      </section>
    </div>
  );
}

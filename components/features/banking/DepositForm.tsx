"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useWallets } from "@/lib/hooks/use-wallet";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { CheckCircle, ShieldCheck, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { useCreateDeposit } from "@/lib/hooks/use-transactions";
import { getDemoFlags } from "@/lib/demo-flags";
import { ActiveWalletCard } from "./ActiveWalletCard";
import Skeleton from "@mui/material/Skeleton";

const PRESET_AMOUNTS = [1000, 5000, 10000];
const PROCESSING_FEE_RATE = 0.002;

const depositSchema = z.object({
  walletId: z.string().min(1, "Please select a wallet"),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be greater than 0"),
  paymentMethod: z.literal("stripe"),
});

type DepositFormValues = z.infer<typeof depositSchema>;

function DepositFormInner({ initialWalletId }: { initialWalletId: string }) {
  const { data: wallets } = useWallets();
  const inputRef = useRef<HTMLInputElement>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const lastIdempotencyKey = useRef<string>("");
  const [isSettling, setIsSettling] = useState(false);
  const deposit = useCreateDeposit();

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    mode: "onChange",
    defaultValues: {
      walletId: initialWalletId,
      amountCents: 0,
      paymentMethod: "stripe",
    },
  });

  const selectedWalletId = form.watch("walletId");
  const wallet =
    wallets?.find((w) => w.id === selectedWalletId) ?? wallets?.[0];
  const amountCents = form.watch("amountCents") || 0;
  const isFrozen =
    wallet?.status === "FROZEN" ||
    getDemoFlags().frozenWalletId === wallet?.id;
  const processingFeeCents = Math.round(amountCents * PROCESSING_FEE_RATE);
  const totalCents = amountCents + processingFeeCents;

  async function onSubmit(values: DepositFormValues) {
    if (isFrozen) { deposit.reset(); return; }
    lastIdempotencyKey.current = idempotencyKey.current;
    await deposit.mutateAsync({
      toWalletId: values.walletId,
      amount: values.amountCents,
      currency: wallet?.currency ?? "GBP",
      idempotencyKey: idempotencyKey.current,
    });
    idempotencyKey.current = crypto.randomUUID();
    form.reset({ walletId: values.walletId, amountCents: 0, paymentMethod: "stripe" });
    if (inputRef.current) inputRef.current.value = "";
    const { kafkaLagMs } = getDemoFlags();
    if (kafkaLagMs > 0) {
      setIsSettling(true);
      setTimeout(() => setIsSettling(false), kafkaLagMs);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-8 mt-12">
        <div className="col-span-2 flex flex-col gap-8">
          {/* Active Wallet Field */}
          <Controller
            name="walletId"
            control={form.control}
            render={({ field, fieldState }) => (
              <ActiveWalletCard
                wallet={wallet}
                field={field}
                error={fieldState.error}
                invalid={fieldState.invalid}
                isSettling={isSettling}
              />
            )}
          />

          {/* Deposit Amount Field */}
          <Controller
            name="amountCents"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Card className="rounded-2xl border border-border">
                  <CardContent className="px-6 space-y-4">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Deposit Amount
                    </FieldLabel>
                    <div className="bg-accent-foreground rounded-full px-6 py-8 flex items-center gap-3">
                      <span className="text-muted/80 text-xl">
                        {formatCurrencyCompact(
                          undefined,
                          wallet?.currency ?? "GBP",
                        )}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        step={0.01}
                        min={0}
                        defaultValue=""
                        aria-invalid={fieldState.invalid}
                        onChange={(e) =>
                          field.onChange(
                            Math.round(
                              (parseFloat(e.target.value) + Number.EPSILON) *
                                100,
                            ) || 0,
                          )
                        }
                        ref={inputRef}
                        className="border-0 bg-transparent text-4xl! font-extrabold p-0 h-auto focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div className="flex gap-2">
                      {PRESET_AMOUNTS.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-full text-sm border-border"
                          onClick={() => {
                            const newAmountCents = amountCents + preset;
                            field.onChange(newAmountCents);
                            if (inputRef.current)
                              inputRef.current.value = (
                                newAmountCents / 100
                              ).toFixed(2);
                          }}
                        >
                          +
                          {formatCurrencyCompact(
                            preset,
                            wallet?.currency ?? "GBP",
                          )}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="link"
                        className="flex-1 rounded-full text-sm"
                        onClick={() => {
                          field.onChange(0);
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </CardContent>
                </Card>
              </Field>
            )}
          />

          {/* Payment Method Field */}
          <Controller
            name="paymentMethod"
            control={form.control}
            render={({ fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Card className="rounded-2xl border border-border">
                  <CardContent className="px-6">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Payment Method
                    </FieldLabel>
                    <div className="flex items-center gap-3 border border-primary rounded-full px-4 py-3 mt-4">
                      <div className="bg-[#635BFF] text-white text-xs font-bold px-2 py-1 rounded">
                        stripe
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Stripe</p>
                        <p className="text-xs text-muted-foreground">
                          Securely processed by Stripe
                        </p>
                      </div>
                      <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </CardContent>
                </Card>
              </Field>
            )}
          />
        </div>

        {/* Right column - Deposit Summary */}
        <div className="flex flex-col gap-8">
          <Card className="rounded-2xl border border-border">
            <CardContent className="px-6 space-y-6">
              <p className="font-semibold text-lg">Deposit Summary</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit Amount</span>
                  <span className="font-bold">
                    {formatCurrency(amountCents, "GBP")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Processing Fee (0.2%)
                  </span>
                  <span className="font-bold">
                    {formatCurrency(processingFeeCents, "GBP")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-bold text-primary">FREE</span>
                </div>
                <hr className="border-border my-4" />
                <div className="flex flex-col justify-between mb-10">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted/70">
                    Total to Pay
                  </span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(totalCents, "GBP")}
                  </span>
                </div>
              </div>
              {deposit.isSuccess && !isFrozen && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <CheckCircle size={14} />
                    Deposit Successful
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Tx ID:</span>{" "}
                    <span className="font-mono break-all">{deposit.data.id}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Idempotency key:</span>{" "}
                    <span className="font-mono break-all">{lastIdempotencyKey.current}</span>
                  </p>
                </div>
              )}
              {deposit.isError && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                  {(deposit.error as { code?: string })?.code === "WALLET_FROZEN"
                    ? "Wallet is frozen — deposit rejected by the server."
                    : "Deposit failed. Please try again."}
                </div>
              )}
              {isFrozen && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                  This wallet is frozen. Deposits are not allowed. Contact support to unfreeze.
                </div>
              )}
              <Button
                type="submit"
                disabled={!form.formState.isValid || deposit.isPending || isFrozen}
                className="w-full rounded-full h-12 text-base shadow-2xl"
              >
                {deposit.isPending ? "Processing..." : "Continue to Stripe →"}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted">
                <ShieldCheck size={14} />
                Securely processed by Stripe
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl ring-0 shadow-none bg-secondary">
            <CardContent className="flex items-start gap-3 px-6">
              <span className="flex items-center bg-background p-3 rounded-full text-primary mt-0.5">
                <Zap size={20} strokeWidth={2} />
              </span>
              <div className="my-auto">
                <p className="text-sm font-bold">Instant Deposit Available</p>
                <p className="text-xs text-muted-foreground">
                  Your funds will be available for trading immediately after the
                  transaction is confirmed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default function DepositForm({ walletId }: { walletId: string }) {
  const { data: wallets, isLoading } = useWallets();

  if (isLoading) return <Skeleton className="h-24 rounded-2xl" />;

  const initialWalletId = walletId || wallets?.[0]?.id || "";

  return (
    <DepositFormInner key={initialWalletId} initialWalletId={initialWalletId} />
  );
}

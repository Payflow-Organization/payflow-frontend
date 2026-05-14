"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWallets } from "@/lib/hooks/use-wallet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { CheckCircle, ShieldCheck, User } from "lucide-react";
import { useRef } from "react";
import { useCreateTransfer } from "@/lib/hooks/use-transactions";
import { getDemoFlags } from "@/lib/demo-flags";
import { Skeleton } from "@/components/ui/skeleton";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const PRESET_AMOUNTS = [1000, 5000, 10000];
const MAX_TRANSFER_AMOUNT_CENTS = 100_000_000;

function TransferFormInner({ initialWalletId }: { initialWalletId: string }) {
  const { data: wallets } = useWallets();
  const inputRef = useRef<HTMLInputElement>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const transfer = useCreateTransfer();
  const transferSchema = z
    .object({
      sourceWalletId: z
        .string()
        .min(1, "Please select a source wallet")
        .uuid("Please select a valid source wallet"),
      amountCents: z
        .number()
        .int("Amount must be a whole number of cents")
        .positive("Amount must be greater than 0")
        .max(
          MAX_TRANSFER_AMOUNT_CENTS,
          `Amount must be less than or equal to ${formatCurrency(
            MAX_TRANSFER_AMOUNT_CENTS,
            wallets?.find((w) => w.id === initialWalletId)?.currency ?? "GBP",
          )}`,
        ),
      destinationWalletId: z
        .string()
        .min(1, "Please select a destination")
        .uuid("Please select a valid destination wallet"),
    })
    .refine((data) => data.sourceWalletId !== data.destinationWalletId, {
      message: "Source and destination wallets must be different",
      path: ["destinationWalletId"],
    });

  type TransferFormValues = z.infer<typeof transferSchema>;
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    mode: "onChange",
    defaultValues: {
      sourceWalletId: initialWalletId,
      amountCents: 0,
      destinationWalletId: "",
    },
  });

  const sourceWalletId = form.watch("sourceWalletId");
  const sourceWallet =
    wallets?.find((w) => w.id === sourceWalletId) ?? wallets?.[0];
  const amountCents = form.watch("amountCents") || 0;
  const destinationWalletId = form.watch("destinationWalletId");
  const balanceCents = sourceWallet?.balance ?? 0;
  const isSourceFrozen =
    sourceWallet?.status === "FROZEN" ||
    getDemoFlags().frozenWalletId === sourceWallet?.id;

  async function onSubmit(values: TransferFormValues) {
    if (isSourceFrozen) { transfer.reset(); return; }
    await transfer.mutateAsync({
      fromWalletId: values.sourceWalletId,
      toWalletId: values.destinationWalletId,
      amount: values.amountCents,
      currency: sourceWallet?.currency ?? "GBP",
      idempotencyKey: idempotencyKey.current,
    });
    idempotencyKey.current = crypto.randomUUID();
    form.reset({
      sourceWalletId: values.sourceWalletId,
      amountCents: 0,
      destinationWalletId: "",
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Source Account - dark green card */}
          <div className="rounded-[48px] bg-primary p-6 py-8 text-primary-foreground relative overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">
              Source Account
            </p>
            <p className="text-2xl font-bold mb-1">
              {sourceWallet?.currency} wallet
            </p>
            <p className="text-3xl font-bold">
              {formatCurrency(balanceCents, sourceWallet?.currency ?? "GBP")}
            </p>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-primary-foreground/10 p-3 rounded-full">
              <AccountBalanceWalletIcon className="text-primary-foreground" style={{ fontSize: 24, width: 24, height: 24 }} />
            </div>
          </div>

          {/* Transfer Amount */}
          <Controller
            name="amountCents"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Card className="rounded-2xl border border-border">
                  <CardContent className="px-6 space-y-4">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Transfer Amount
                    </FieldLabel>
                    <div
                      className="bg-accent-foreground rounded-full px-6 py-15 flex items-center gap-3 cursor-text has-focus:ring-1 has-focus:ring-primary/40 transition-colors"
                      onClick={() => inputRef.current?.focus()}
                    >
                      <span className="text-muted-foreground text-lg">
                        {formatCurrencyCompact(
                          undefined,
                          sourceWallet?.currency ?? "GBP",
                        )}
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        defaultValue=""
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => {
                          const parsed = parseFloat(
                            e.target.value.replace(",", "."),
                          );
                          field.onChange(
                            isNaN(parsed)
                              ? 0
                              : Math.round((parsed + Number.EPSILON) * 100),
                          );
                        }}
                        ref={inputRef}
                        className="border-0 bg-transparent !text-2xl font-bold p-0 h-auto focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/40 text-center"
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
                            sourceWallet?.currency ?? "GBP",
                          )}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="link"
                        className="flex-1 text-sm"
                        onClick={() => {
                          field.onChange(0);
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Field>
            )}
          />

          {/* Destination */}
          <Controller
            name="destinationWalletId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Card className="rounded-2xl border border-border">
                  <CardContent className="p-6 space-y-4">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Destination
                    </FieldLabel>

                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <User size={13} /> Enter recipient wallet ID
                      </p>
                      <Input
                        placeholder="e.g. 032ed816-17d1-4797-a55e-c8a15abd3b64"
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="rounded-xl h-12"
                      />
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

        {/* Right column - Transfer Summary */}
        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl border border-border">
            <CardContent className="px-6 space-y-5">
              <p className="font-semibold text-lg">Transfer Summary</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer Amount</span>
                  <span className="font-bold">
                    {formatCurrency(
                      amountCents,
                      sourceWallet?.currency ?? "GBP",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(0, sourceWallet?.currency ?? "GBP")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arrival Time</span>
                  <span className="font-bold">Instant</span>
                </div>

                {/* Destination preview */}
                {destinationWalletId && (
                  <div className="rounded-xl bg-accent p-3 space-y-0.5 mt-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      → To
                    </p>
                    <p className="font-semibold text-xs break-all">
                      {destinationWalletId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      External Transfer
                    </p>
                  </div>
                )}

                <hr className="border-border" />
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Total Deduction
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      amountCents,
                      sourceWallet?.currency ?? "GBP",
                    )}
                  </span>
                </div>
              </div>

              {transfer.isSuccess && !isSourceFrozen && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-0.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <CheckCircle size={14} />
                    Transfer Successful
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {transfer.data.id}
                  </p>
                </div>
              )}
              {transfer.isError && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                  {(transfer.error as { code?: string })?.code === "WALLET_FROZEN"
                    ? "Source wallet is frozen — transfer rejected by the server."
                    : "Transfer failed. Please try again."}
                </div>
              )}
              {isSourceFrozen && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                  Source wallet is frozen. Transfers are not allowed. Contact support to unfreeze.
                </div>
              )}
              <Button
                type="submit"
                disabled={!form.formState.isValid || transfer.isPending || isSourceFrozen}
                className="w-full rounded-full h-12 text-base shadow-2xl"
              >
                {transfer.isPending ? "Processing..." : "Confirm Transfer →"}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={14} />
                Bank-grade security encryption
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default function TransferForm({ walletId }: { walletId: string }) {
  const { data: wallets, isLoading } = useWallets();

  if (isLoading) return <Skeleton className="h-24 rounded-2xl" />;

  const initialWalletId = walletId || wallets?.[0]?.id || "";

  return (
    <TransferFormInner
      key={initialWalletId}
      initialWalletId={initialWalletId}
    />
  );
}

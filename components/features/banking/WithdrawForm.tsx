"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWallets } from "@/lib/hooks/use-wallet";
import { ActiveWalletCard } from "./ActiveWalletCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { CheckCircle, InfoIcon } from "lucide-react";
import { useRef } from "react";
import { useCreateWithdrawal } from "@/lib/hooks/use-transactions";
import { getDemoFlags } from "@/lib/demo-flags";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Skeleton } from "@/components/ui/skeleton";

const PROCESSING_TIME = "1-3 Business Days";
const PRESET_PERCENTAGES = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
];

const withdrawSchema = z.object({
  walletId: z.string().min(1, "Please select a wallet"),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be greater than 0"),
  withdrawTo: z.string().min(1, "Please select a withdrawal destination"),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

function WithdrawFormInner({ initialWalletId }: { initialWalletId: string }) {
  const { data: wallets } = useWallets();
  const inputRef = useRef<HTMLInputElement>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const withdraw = useCreateWithdrawal();

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    mode: "onChange",
    defaultValues: {
      walletId: initialWalletId,
      amountCents: 0,
      withdrawTo: "test",
    },
  });

  const selectedWalletId = form.watch("walletId");
  const wallet =
    wallets?.find((w) => w.id === selectedWalletId) ?? wallets?.[0];
  const amountCents = form.watch("amountCents") || 0;
  const balanceCents = wallet?.balance ?? 0;
  const isFrozen =
    wallet?.status === "FROZEN" ||
    getDemoFlags().frozenWalletId === wallet?.id;

  async function onSubmit(values: WithdrawFormValues) {
    if (isFrozen) { withdraw.reset(); return; }
    await withdraw.mutateAsync({
      fromWalletId: values.walletId,
      amount: values.amountCents,
      currency: wallet?.currency ?? "GBP",
      idempotencyKey: idempotencyKey.current,
    });
    idempotencyKey.current = crypto.randomUUID();
    form.reset({
      walletId: values.walletId,
      amountCents: 0,
      withdrawTo: "test",
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 gap-8 mt-12">
        <div className="col-span-2 flex flex-col gap-8">
          {/* Active Wallet */}
          <Controller
            name="walletId"
            control={form.control}
            render={({ field, fieldState }) => (
              <ActiveWalletCard
                wallet={wallet}
                field={field}
                error={fieldState.error}
                invalid={fieldState.invalid}
              />
            )}
          />

          {/* Withdrawal Amount */}
          <Controller
            name="amountCents"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Card className="rounded-2xl border border-border">
                  <CardContent className="px-6 space-y-4">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Withdrawal Amount
                    </FieldLabel>
                    <div className="bg-accent-foreground rounded-full px-6 py-10 flex items-center gap-3">
                      <span className="text-muted/80 text-xl">
                        {formatCurrencyCompact(
                          undefined,
                          wallet?.currency ?? "GBP",
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
                        className="border-0 bg-transparent text-4xl! font-extrabold p-0 h-auto focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div className="flex gap-2">
                      {PRESET_PERCENTAGES.map(({ label, value }) => (
                        <Button
                          key={label}
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-full text-sm border-border"
                          onClick={() => {
                            const newAmountCents = Math.round(
                              balanceCents * value,
                            );
                            field.onChange(newAmountCents);
                            if (inputRef.current)
                              inputRef.current.value = (
                                newAmountCents / 100
                              ).toFixed(2);
                          }}
                        >
                          {label}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="default"
                        className="flex-1 rounded-full text-sm"
                        onClick={() => {
                          field.onChange(balanceCents);
                          if (inputRef.current)
                            inputRef.current.value = (
                              balanceCents / 100
                            ).toFixed(2);
                        }}
                      >
                        MAX
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

          {/* Withdraw To */}
          <Controller
            name="withdrawTo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Card className="rounded-2xl border border-border">
                  <CardContent className="px-6 space-y-4">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Withdraw To
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => field.onChange("test")}
                      className="flex-1 flex items-center w-full gap-3 p-4 rounded-2xl border-2 transition-colors border-primary"
                    >
                      <span className="flex items-center justify-center bg-primary/10 h-10 w-10 rounded-full text-primary shrink-0">
                        <AccountBalanceWalletIcon className="h-4 w-4" />
                      </span>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-sm">Test service</p>
                      </div>
                    </button>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </CardContent>
                </Card>
              </Field>
            )}
          />
        </div>

        {/* Right column - Transaction Summary */}
        <div className="flex flex-col gap-8">
          <Card className="rounded-2xl border border-border">
            <CardContent className="px-6 space-y-6">
              <p className="font-semibold text-lg">Transaction Summary</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Withdrawal amount
                  </span>
                  <span className="font-bold">
                    {formatCurrency(amountCents, wallet?.currency ?? "GBP")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network fees</span>
                  <span className="font-bold text-primary">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing time</span>
                  <span className="font-bold">{PROCESSING_TIME}</span>
                </div>
                <hr className="border-border my-4" />
                <div className="flex justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted/70">
                    Total to receive
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(amountCents, wallet?.currency ?? "GBP")}
                  </span>
                </div>
              </div>
              <Card className="rounded-xl border-0 bg-primary/5 flex flex-row gap-3 p-4 text-primary">
                <InfoIcon />
                <CardContent className="text-xs p-0">
                  Withdrawals to services are subject to standard verification.
                  Funds typically arrive within 24-72 hours.
                </CardContent>
              </Card>
              {withdraw.isSuccess && !isFrozen && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-0.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <CheckCircle size={14} />
                    Withdrawal Successful
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {withdraw.data.id}
                  </p>
                </div>
              )}
              {withdraw.isError && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                  {(withdraw.error as { code?: string })?.code === "WALLET_FROZEN"
                    ? "Wallet is frozen — withdrawal rejected by the server."
                    : "Withdrawal failed. Please try again."}
                </div>
              )}
              {isFrozen && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                  This wallet is frozen. Withdrawals are not allowed. Contact support to unfreeze.
                </div>
              )}
              <Button
                type="submit"
                disabled={!form.formState.isValid || withdraw.isPending || isFrozen}
                className="w-full rounded-full h-12 text-base shadow-2xl"
              >
                {withdraw.isPending ? "Processing..." : "Confirm Withdrawal"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default function WithdrawForm({ walletId }: { walletId: string }) {
  const { data: wallets, isLoading } = useWallets();

  if (isLoading) return <Skeleton className="h-24 rounded-2xl" />;

  const initialWalletId = walletId || wallets?.[0]?.id || "";

  return (
    <WithdrawFormInner
      key={initialWalletId}
      initialWalletId={initialWalletId}
    />
  );
}

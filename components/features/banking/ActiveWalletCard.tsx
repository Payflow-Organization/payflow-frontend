"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { WalletSwitcher } from "../wallet/WalletSwitcher";
import { formatCurrency } from "@/lib/utils";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  FieldError as RHFFieldError,
} from "react-hook-form";
import { getDemoFlags } from "@/lib/demo-flags";
import type { WalletStatus } from "@/lib/types";

type Wallet = {
  id: string;
  currency: string;
  balance: number;
  status?: WalletStatus;
};

type ActiveWalletCardProps<T extends FieldValues> = {
  wallet: Wallet | undefined;
  field: ControllerRenderProps<T, Path<T>>;
  error?: RHFFieldError;
  invalid: boolean;
  isSettling?: boolean;
};

export function ActiveWalletCard<T extends FieldValues>({
  wallet,
  field,
  error,
  invalid,
  isSettling = false,
}: ActiveWalletCardProps<T>) {
  const isFrozenByDemo = wallet?.id ? getDemoFlags().frozenWalletId === wallet.id : false;
  const isFrozen = isFrozenByDemo || (wallet?.status && wallet.status !== "ACTIVE");
  const statusLabel = isFrozenByDemo ? "FROZEN (demo)" : wallet?.status;

  return (
    <Field data-invalid={invalid}>
      <Card className="rounded-2xl border border-border">
        <CardContent className="mt-1">
          <div className="flex items-center justify-between mb-4">
            <FieldLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Active Wallet
            </FieldLabel>
            <div className="flex items-center gap-2">
              {isFrozen && (
                <span className="flex items-center gap-1 text-xs font-bold bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                  <Lock size={10} /> {statusLabel}
                </span>
              )}
              <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                {wallet?.currency ?? "GBP"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center bg-primary/10 h-12 w-12 rounded-full text-primary">
                <AccountBalanceWalletIcon style={{ fontSize: 20, width: 20, height: 20 }} />
              </span>
              <div>
                <p className="font-semibold text-xl">
                  {`${wallet?.currency} wallet`} (....
                  {wallet?.id?.slice(-4) ?? "0000"})
                </p>
                {isSettling ? (
                  <p className="text-sm text-amber-600 flex items-center gap-1 -mt-0.5">
                    <Loader2 size={12} className="animate-spin" />
                    Balance updating…
                  </p>
                ) : (
                  <p className="text-sm font-normal text-muted-foreground -mt-0.5">
                    Current Balance:{" "}
                    {formatCurrency(wallet?.balance ?? 0, wallet?.currency ?? "GBP")}
                  </p>
                )}
              </div>
            </div>
            <WalletSwitcher
              onSelect={(id) => field.onChange(id)}
              trigger={
                <Button
                  variant="link"
                  className="text-primary font-bold text-sm h-auto p-0"
                >
                  Change Wallet <ChevronDown />
                </Button>
              }
            />
          </div>
          {isFrozen && (
            <div className="mt-3 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              This wallet is {statusLabel?.toLowerCase()}. Transactions are not permitted.
            </div>
          )}
          {invalid && error && <FieldError errors={[error]} />}
        </CardContent>
      </Card>
    </Field>
  );
}

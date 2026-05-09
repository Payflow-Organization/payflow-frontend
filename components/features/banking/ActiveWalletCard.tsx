"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { WalletSwitcher } from "../wallet/WalletSwitcher";
import { formatCurrency } from "@/lib/utils";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { ChevronDown } from "lucide-react";
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  FieldError as RHFFieldError,
} from "react-hook-form";

type Wallet = {
  id: string;
  currency: string;
  balance: number;
};

type ActiveWalletCardProps<T extends FieldValues> = {
  wallet: Wallet | undefined;
  field: ControllerRenderProps<T, Path<T>>;
  error?: RHFFieldError;
  invalid: boolean;
};

export function ActiveWalletCard<T extends FieldValues>({
  wallet,
  field,
  error,
  invalid,
}: ActiveWalletCardProps<T>) {
  return (
    <Field data-invalid={invalid}>
      <Card className="rounded-2xl border border-border">
        <CardContent className="mt-1">
          <div className="flex items-center justify-between mb-4">
            <FieldLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Active Wallet
            </FieldLabel>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
              {wallet?.currency ?? "GBP"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center bg-primary/10 h-12 w-12 rounded-full text-primary">
                <AccountBalanceWalletIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-xl">
                  {`${wallet?.currency} wallet`} (....
                  {wallet?.id?.slice(-4) ?? "0000"})
                </p>
                <p className="text-sm font-normal text-muted-foreground -mt-0.5">
                  Current Balance:{" "}
                  {formatCurrency(
                    wallet?.balance ?? 0,
                    wallet?.currency ?? "GBP",
                  )}
                </p>
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
          {invalid && error && <FieldError errors={[error]} />}
        </CardContent>
      </Card>
    </Field>
  );
}

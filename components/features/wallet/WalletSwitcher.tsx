"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallets } from "@/lib/hooks/use-wallet";
import { formatCurrencyCompact } from "@/lib/utils";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function WalletSwitcher({
  trigger,
  onSelect,
}: {
  trigger: React.ReactNode;
  onSelect?: (id: string) => void;
}) {
  const { data: wallets } = useWallets();
  const router = useRouter();
  const pathname = usePathname();
  const walletId = useSearchParams().get("walletId");
  const active = wallets?.find((w) => w.id === walletId) ?? wallets?.[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup
          value={active?.id}
          onValueChange={(id) => {
            onSelect?.(id);
            router.replace(`${pathname}?walletId=${id}`);
          }}
        >
          {wallets?.map((w) => (
            <DropdownMenuRadioItem
              key={w.id}
              value={w.id}
              className="flex gap-2 items-center pl-8 pr-2 [&>[data-slot='dropdown-menu-radio-item-indicator']]:left-2 [&>[data-slot='dropdown-menu-radio-item-indicator']]:right-auto"
            >
              <span className="font-medium">{w.currency} wallet</span>
              <span className="text-muted-foreground">
                {formatCurrencyCompact(w.balance, w.currency)}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus size={14} />
          New Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

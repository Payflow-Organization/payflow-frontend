import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useWallets } from "@/lib/hooks/use-wallet";
import { formatCurrencyCompact } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function DashboardHeader() {
  const { data: wallets } = useWallets();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const walletIdParam = searchParams.get("walletId");
  const active = wallets?.find((w) => w.id === walletIdParam) ?? wallets?.[0];

  return (
    <header className="flex justify-between items-center w-full px-8 py-2.5 min-h-16 border-b border-border">
      <ul className="flex gap-6 items-center">
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 h-11 font-semibold text-base border-border border-2 rounded-4xl text-[#151C27] bg-[#FAFAFA] hover:bg-[#FAFAFA]/80">
                {active ? (
                  <>
                    <Wallet size={14} />
                    <span>{active.currency} wallet</span>
                  </>
                ) : (
                  "Select Wallet"
                )}
                <ChevronDown size={14} color="#A3A3A3" strokeWidth={3} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuRadioGroup
                value={active?.id}
                onValueChange={(id) => {
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
        </li>
        <li>
          <InputGroup className="gap-1 h-9 border-border border-2 rounded-4xl bg-[#FAFAFA]">
            <InputGroupAddon className="text-[#6B7280]">
              <Search size={16} strokeWidth={3} />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search transactions..." />
          </InputGroup>
        </li>
      </ul>
      <ul className="flex gap-6 items-center">
        <li className="text-[#6B7280]">
          <Bell />
        </li>
        <li className="text-[#6B7280]">
          <CircleHelp />
        </li>
        <hr className="h-6 w-px bg-border border-none" />
        <li className="text-[#6B7280]">Profile</li>
      </ul>
    </header>
  );
}

export default DashboardHeader;

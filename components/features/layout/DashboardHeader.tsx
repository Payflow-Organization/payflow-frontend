"use client";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useWallets } from "@/lib/hooks/use-wallet";
import { Bell, ChevronDown, CircleHelp, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WalletSwitcher } from "../wallet/WalletSwitcher";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

function DashboardHeader() {
  const { data: wallets } = useWallets();
  const router = useRouter();
  const pathname = usePathname();
  const walletId = useSearchParams().get("walletId");
  const active = wallets?.find((w) => w.id === walletId) ?? wallets?.[0];

  return (
    <header className="flex justify-between items-center w-full px-8 py-2.5 min-h-16 border-b border-border">
      <ul className="flex gap-6 items-center">
        <li>
          <WalletSwitcher
            trigger={
              <Button className="gap-2 h-11 font-semibold text-base border-border border-2 rounded-4xl text-[#151C27] bg-[#FAFAFA] hover:bg-[#FAFAFA]/80">
                {active ? (
                  <>
                    <div className="text-primary text-sm">
                      <AccountBalanceWalletIcon />
                    </div>
                    <span>{active.currency} wallet</span>
                  </>
                ) : (
                  "Select Wallet"
                )}
                <ChevronDown size={14} color="#A3A3A3" strokeWidth={3} />
              </Button>
            }
          />
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
        <li>
          <hr className="h-6 w-px bg-border border-none" />
        </li>
        <li className="text-[#6B7280]">Profile</li>
      </ul>
    </header>
  );
}

export default DashboardHeader;

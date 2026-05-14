"use client";
import { ArrowRightLeft, Landmark, LogOut, PlusCircle, FlaskConical, Loader2, X } from "lucide-react";
import { IconLayoutDashboard } from "@tabler/icons-react";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLogout } from "@/lib/hooks/use-auth";
import { useWallets } from "@/lib/hooks/use-wallet";
import { Button } from "@/components/ui/button";

const navLinks = [
  {
    href: "/dashboard",
    icon: <IconLayoutDashboard stroke={2} />,
    label: "Dashboard",
  },
  { href: "/banking", icon: <Landmark />, label: "Banking" },
  { href: "/analytics", icon: <TimelineOutlinedIcon />, label: "Analytics" },
  {
    href: "/transactions",
    icon: <ReceiptLongOutlinedIcon />,
    label: "Transactions",
  },
  {
    href: "/scenarios",
    icon: <FlaskConical size={20} />,
    label: "Scenarios",
  },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: wallets } = useWallets();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const walletId = searchParams.get("walletId") ?? wallets?.[0]?.id;
  const walletQuery = walletId ? `?walletId=${walletId}` : "";
  const router = useRouter();

  return (
    <nav className="max-w-64 w-full h-full border-r border-border py-6 flex flex-col bg-background">
      {onClose && (
        <button onClick={onClose} className="lg:hidden self-end px-6 mb-2 text-muted-foreground">
          <X size={20} />
        </button>
      )}
      <h1 className="text-primary font-bold text-lg px-8">Payflow</h1>
      <ul className="mt-10 flex flex-col gap-1 text-[#6B7280] [&>li]:h-12 [&>li]:flex [&>li]:items-center">
        {navLinks.map(({ href, icon, label }) => (
          <li
            key={href}
            data-active={pathname === href}
            className="rounded-lg mr-4 hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
          >
            <Link
              href={`${href}${walletQuery}`}
              className="flex items-center gap-3 w-full h-full px-8"
            >
              {icon}
              {label}
            </Link>
          </li>
        ))}
        <li className="h-12 flex items-center rounded-lg text-[#6B7280] hover:text-destructive cursor-pointer">
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="flex items-center gap-3 w-full px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </li>
      </ul>
      <div className="px-6">
        <hr className="border-border my-4" />
      </div>
      <p className="px-8 uppercase font-normal text-[10px] text-muted-foreground">
        Quick actions
      </p>
      <ul className="px-8 flex flex-col gap-3 mt-3">
        <li>
          <Button
            variant="default"
            className="w-full rounded-3xl min-h-11"
            onClick={() =>
              router.push(`/banking?walletId=${walletId}&tab=deposit`)
            }
          >
            <PlusCircle />
            Deposit
          </Button>
        </li>
        <li>
          <Button
            variant="outline"
            className="w-full rounded-3xl min-h-11 text-primary"
            onClick={() =>
              router.push(`/banking?walletId=${walletId}&tab=transfer`)
            }
          >
            <ArrowRightLeft />
            Transfer
          </Button>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;

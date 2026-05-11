import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import type { Transaction } from "@/lib/types";

function typeBadgeClass(type: string) {
  const map: Record<string, string> = {
    DEPOSIT: "bg-primary/10 text-primary border-0 py-1 px-3",
    WITHDRAW: "bg-foreground text-background border-0 py-1 px-3",
    TRANSFER: "bg-muted/20 text-muted-foreground border-0 py-1 px-3",
  };
  return map[type] ?? "bg-muted text-muted-foreground border-0 py-1 px-3";
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    SUCCESS: "bg-green-50 text-green-700 border-green-200 py-1 px-3",
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200 py-1 px-3",
    FAILED: "bg-red-50 text-red-700 border-red-200 py-1 px-3",
  };
  return map[status] ?? "bg-muted text-muted-foreground border-0 py-1 px-3";
}

function statusLabel(status: string) {
  return (
    { SUCCESS: "Complete", PENDING: "Pending", FAILED: "Failed" }[status] ?? status
  );
}

function amountClass(type: string) {
  if (type === "DEPOSIT") return "text-primary font-bold";
  if (type === "WITHDRAW" || type === "TRANSFER") return "text-[#BA1A1A] font-bold";
  return "font-bold";
}

export function RecentActivity({
  transactions,
  currency,
  walletId,
  isLoading,
}: {
  transactions: Transaction[];
  currency: string;
  walletId: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-muted-foreground">
          Recent Activity
        </h2>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-base font-normal text-primary h-7 px-2"
        >
          <Link href={`/transactions?walletId=${walletId}`}>
            View full history →
          </Link>
        </Button>
      </div>
      <Table className="[&_td]:py-4 [&_th]:py-4">
        <TableHeader>
          <TableRow className="text-xs uppercase tracking-widest hover:bg-transparent [&_th]:text-muted/70 [&_th]:font-extrabold">
            <TableHead>Transaction ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                </TableRow>
              ))
            : transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-accent/50">
                  <TableCell className="font-mono font-semibold text-sm">
                    #{tx.id.slice(0, 10).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs font-bold uppercase", typeBadgeClass(tx.type))}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right text-sm", amountClass(tx.type))}>
                    {tx.type === "DEPOSIT" ? "+" : "-"}
                    {formatCurrency(tx.amount, currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-bold", statusBadgeClass(tx.status))}
                    >
                      {statusLabel(tx.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

function typeBadge(type: string) {
  const map: Record<string, string> = {
    DEPOSIT: "bg-primary/10 text-primary border-0 py-1 px-3",
    WITHDRAW: "bg-foreground text-background border-0 py-1 px-3",
    TRANSFER: "bg-muted/20 text-muted-foreground border-0 py-1 px-3",
  };
  return map[type] ?? "bg-muted text-muted-foreground border-0 py-1 px-3";
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    SUCCESS: "bg-green-50 text-green-700 border-green-200 py-1 px-3",
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200 py-1 px-3",
    FAILED: "bg-red-50 text-red-700 border-red-200 py-1 px-3",
  };
  return map[status] ?? "bg-muted text-muted-foreground border-0 py-1 px-3";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    SUCCESS: "Complete",
    PENDING: "Pending",
    FAILED: "Failed",
  };
  return map[status] ?? status;
}

function amountColor(type: string) {
  if (type === "DEPOSIT") return "text-primary font-bold";
  if (type === "WITHDRAW" || type === "TRANSFER") return "text-[#BA1A1A] font-bold";
  return "font-bold";
}

type Props = {
  transactions: Transaction[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
};

export function TransactionTable({
  transactions,
  isLoading,
  page,
  totalPages,
  totalElements,
  onPageChange,
}: Props) {
  return (
    <Card className="rounded-lg border border-border">
      <CardContent className="p-0">
        <div className="flex items-center justify-between pb-4 px-6 border-b border-border">
          <p className="font-bold text-sm">
            All Records{" "}
            {!isLoading && (
              <span className="text-muted-foreground font-normal">
                ({totalElements})
              </span>
            )}
          </p>
          <div className="flex items-center gap-4">
            {!isLoading && totalElements > 0 && (
              <p className="text-sm italic text-muted-foreground whitespace-nowrap">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, totalElements)} of{" "}
                {totalElements} records
              </p>
            )}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-sm border-border"
                      onClick={() => onPageChange(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-sm border-border"
                      onClick={() =>
                        onPageChange(Math.min(totalPages - 1, page + 1))
                      }
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>

        <Table className="[&_td]:px-6 [&_td]:py-4 [&_th]:px-6 [&_th]:py-4">
          <TableHeader>
            <TableRow className="text-xs uppercase tracking-widest hover:bg-transparent [&_th]:text-muted/70 [&_th]:font-extrabold">
              <TableHead>Transaction ID</TableHead>
              <TableHead>Wallet ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-accent/50">
                  <TableCell className="flex gap-1 font-mono font-semibold text-sm">
                    #<span>{tx.id.slice(0, 10).toUpperCase()}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          tx.status === "SUCCESS"
                            ? "bg-primary"
                            : tx.status === "PENDING"
                              ? "bg-muted/50"
                              : "bg-destructive"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        ....
                        {(tx.fromWalletId ?? tx.toWalletId ?? "").slice(-4)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs font-bold uppercase ${typeBadge(tx.type)}`}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold text-sm ${amountColor(tx.type)}`}
                  >
                    {tx.type === "DEPOSIT" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold ${statusBadge(tx.status)}`}
                    >
                      {statusLabel(tx.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

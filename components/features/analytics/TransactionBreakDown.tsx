"use client";

import type { ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileDown,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import type { SpendingByCategory, TransactionType } from "@/lib/types";
import {
  downloadStatementCSV,
  downloadStatementPDF,
} from "@/lib/api/analytics";

type Status = "Stable" | "Neutral" | "Warning";

interface TypeMeta {
  label: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  barHex: string;
}

const TYPE_META: Record<TransactionType, TypeMeta> = {
  DEPOSIT: {
    label: "Deposit",
    icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    barHex: "#16a085",
  },
  TRANSFER: {
    label: "Transfer",
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
    iconBg: "bg-muted/10",
    iconColor: "text-muted-foreground",
    barHex: "#18181b",
  },
  WITHDRAW: {
    label: "Withdraw",
    icon: <ArrowUpRight className="h-3.5 w-3.5" />,
    iconBg: "bg-red-50",
    iconColor: "text-destructive",
    barHex: "#ef4444",
  },
};

const TYPE_ORDER: TransactionType[] = ["DEPOSIT", "TRANSFER", "WITHDRAW"];

function deriveStatus(type: TransactionType, allocation: number): Status {
  if (type === "DEPOSIT")
    return allocation >= 55
      ? "Stable"
      : allocation >= 35
        ? "Neutral"
        : "Warning";
  if (type === "WITHDRAW")
    return allocation > 20 ? "Warning" : allocation > 10 ? "Neutral" : "Stable";
  return "Neutral";
}

const statusStyles: Record<Status, string> = {
  Stable: "bg-primary/10 text-primary hover:bg-primary/10 border-transparent",
  Neutral:
    "bg-muted/10 text-muted-foreground hover:bg-muted/10 border-transparent",
  Warning: "bg-red-50 text-red-500 hover:bg-red-50 border-transparent",
};

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs px-3 py-1 rounded-full",
        statusStyles[status],
      )}
    >
      {status}
    </Badge>
  );
}

interface ComputedRow {
  type: TransactionType;
  volume: string;
  allocation: number;
  status: Status;
}

function buildRows(
  spending: SpendingByCategory[],
  currency: string,
): ComputedRow[] {
  const total = spending.reduce((sum, s) => sum + s.totalCents, 0);
  if (total === 0) return [];
  return TYPE_ORDER.map((type) => {
    const entry = spending.find((s) => s.transactionType === type);
    if (!entry) return null;
    const allocation = Math.round((entry.totalCents / total) * 100);
    return {
      type,
      volume: formatCurrency(entry.totalCents, currency),
      allocation,
      status: deriveStatus(type, allocation),
    };
  }).filter((r): r is ComputedRow => r !== null);
}


interface TransactionBreakdownProps {
  spending: SpendingByCategory[];
  currency: string;
  isLoading?: boolean;
  walletId: string;
  from: string;
  to: string;
}

export function TransactionBreakdown({
  spending,
  currency,
  isLoading,
  walletId,
  from,
  to,
}: TransactionBreakdownProps) {
  const rows = buildRows(spending, currency);

  return (
    <Card className="px-8">
      <CardHeader className="pb-0 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Transaction Breakdown
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="link"
                size="sm"
                className="font-bold text-primary text-sm gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                Download
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => downloadStatementCSV(walletId, from, to)}>
                <FileText className="h-3.5 w-3.5 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadStatementPDF(walletId, from, to)}>
                <FileDown className="h-3.5 w-3.5 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-2">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent [&_th]:text-muted/70 [&_th]:font-medium [&_th]:text-xs">
              <TableHead className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase pl-0 w-[28%]">
                Type
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase text-right w-[20%]">
                Volume
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase text-right w-[32%]">
                Allocation
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase text-right pr-0 w-[20%]">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/50">
                    <TableCell className="pl-0 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-7 h-7 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-1.5 w-24" />
                        <Skeleton className="h-4 w-7" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-0 py-4">
                      <Skeleton className="h-6 w-16 ml-auto rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((row) => {
                  const meta = TYPE_META[row.type];
                  return (
                    <TableRow
                      key={row.type}
                      className="border-b border-border/50 hover:bg-accent/50"
                    >
                      <TableCell className="pl-0 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                              meta.iconBg,
                              meta.iconColor,
                            )}
                          >
                            {meta.icon}
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {meta.label}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm font-medium text-foreground py-4 text-right tabular-nums">
                        {row.volume}
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 shrink-0">
                            <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted/10 shrink-0">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${row.allocation}%`,
                                  backgroundColor: meta.barHex,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-7 text-right shrink-0">
                            {row.allocation}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-0 py-4">
                        <StatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

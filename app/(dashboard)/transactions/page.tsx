"use client";

import { useState, Suspense } from "react";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { TransactionFilters } from "@/components/features/transactions/TransactionFilters";
import { TransactionTable } from "@/components/features/transactions/TransactionTable";
import { TransactionSummaryCards } from "@/components/features/transactions/TransactionSummaryCards";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const walletId = useSearchParams().get("walletId") ?? "";

  const [page, setPage] = useState(0);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [pendingType, setPendingType] = useState("all");
  const [pendingStatus, setPendingStatus] = useState("all");

  const { data, isLoading } = useTransactions(walletId, {
    page,
    size: PAGE_SIZE,
    type: type === "all" ? undefined : type,
    status: status === "all" ? undefined : status,
  });

  function applyFilters() {
    setType(pendingType);
    setStatus(pendingStatus);
    setPage(0);
  }

  function resetFilters() {
    setPendingType("all");
    setPendingStatus("all");
    setType("all");
    setStatus("all");
    setPage(0);
  }

  return (
    <div className="space-y-6 px-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transaction History</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Review and manage your financial movements across all linked
            wallets.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Export CSV
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/banking?walletId=${walletId}&tab=deposit`}>
              <Plus size={16} />
              New Transaction
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : (
        <TransactionFilters
          pendingType={pendingType}
          pendingStatus={pendingStatus}
          appliedType={type}
          appliedStatus={status}
          onTypeChange={setPendingType}
          onStatusChange={setPendingStatus}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      )}

      <TransactionTable
        transactions={data?.content ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 0}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />
      <TransactionSummaryCards walletId={walletId} />
    </div>
  );
}

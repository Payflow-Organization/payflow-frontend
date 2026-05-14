"use client";
import DepositForm from "@/components/features/banking/DepositForm";
import TransferForm from "@/components/features/banking/TransferForm";
import WithdrawForm from "@/components/features/banking/WithdrawForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <BankingContent />
    </Suspense>
  );
}

function BankingContent() {
  const walletId = useSearchParams().get("walletId") ?? "";
  const tab = useSearchParams().get("tab") ?? "deposit";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Funds Management</h1>
      <Tabs defaultValue={tab} key={tab}>
        <TabsList className="px-1 py-5 bg-secondary rounded-full w-max max-w-full overflow-x-auto">
          <TabsTrigger value="deposit" className="py-4 px-8">
            Deposit
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="py-4 px-8">
            Withdraw
          </TabsTrigger>
          <TabsTrigger value="transfer" className="py-4 px-8">
            Transfer
          </TabsTrigger>
        </TabsList>
        <TabsContent value="deposit">
          <DepositForm walletId={walletId} />
        </TabsContent>
        <TabsContent value="withdraw">
          <WithdrawForm walletId={walletId} />
        </TabsContent>
        <TabsContent value="transfer">
          <TransferForm walletId={walletId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";
import DepositForm from "@/components/features/banking/DepositForm";
import TransferForm from "@/components/features/banking/TransferForm";
import WithdrawForm from "@/components/features/banking/WithdrawForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import React from "react";

function Page() {
  const walletId = useSearchParams().get("walletId") ?? "";
  const tab = useSearchParams().get("tab") ?? "deposit";

  return (
    <div className="space-y-6 px-8">
      <h1 className="text-2xl font-semibold">Funds Management</h1>
      <Tabs defaultValue={tab} key={tab}>
        <TabsList className="px-1 py-5 bg-secondary rounded-full w-max">
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

export default Page;

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  DepositRequest,
  TransferRequest,
  WithdrawRequest,
} from "@/lib/types";
import {
  mockGetTransactions,
  mockGetRecentTransactions,
  mockCreateDeposit,
  mockCreateWithdraw,
  mockCreateTransfer,
} from "../mocks/transaction";
import { getDemoFlags } from "@/lib/demo-flags";

async function withKafkaLag() {
  const { kafkaLagMs } = getDemoFlags();
  if (kafkaLagMs > 0) await new Promise((r) => setTimeout(r, kafkaLagMs));
}

export function useTransactions(
  walletId: string,
  params: { page: number; size: number; type?: string; status?: string },
) {
  return useQuery({
    queryKey: ["transactions", walletId, params],
    queryFn: () => mockGetTransactions(walletId, params),
    enabled: !!walletId,
  });
}

export function useRecentTransactions(walletId: string, limit: number) {
  return useQuery({
    queryKey: ["transactions", "recent", walletId, limit],
    queryFn: () => mockGetRecentTransactions(walletId, limit),
    enabled: !!walletId,
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepositRequest) => mockCreateDeposit(data),
    onSuccess: async () => {
      await withKafkaLag();
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawRequest) => mockCreateWithdraw(data),
    onSuccess: async () => {
      await withKafkaLag();
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferRequest) => mockCreateTransfer(data),
    onSuccess: async () => {
      await withKafkaLag();
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

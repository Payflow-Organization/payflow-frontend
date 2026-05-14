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
import {
  getTransactions,
  createDeposit,
  createWithdraw,
  createTransfer,
} from "@/lib/api/transaction";
import { getDemoFlags } from "@/lib/demo-flags";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

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
    queryFn: () =>
      USE_MOCK
        ? mockGetTransactions(walletId, params)
        : getTransactions(walletId, params),
    enabled: !!walletId,
  });
}

export function useRecentTransactions(walletId: string, limit: number) {
  return useQuery({
    queryKey: ["transactions", "recent", walletId, limit],
    queryFn: () =>
      USE_MOCK
        ? mockGetRecentTransactions(walletId, limit)
        : getTransactions(walletId, { page: 0, size: limit }).then((r) => r.content),
    enabled: !!walletId,
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepositRequest) =>
      USE_MOCK ? mockCreateDeposit(data) : createDeposit(data),
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
    mutationFn: (data: WithdrawRequest) =>
      USE_MOCK ? mockCreateWithdraw(data) : createWithdraw(data),
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
    mutationFn: (data: TransferRequest) =>
      USE_MOCK ? mockCreateTransfer(data) : createTransfer(data),
    onSuccess: async () => {
      await withKafkaLag();
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

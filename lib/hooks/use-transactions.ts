"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  DepositRequest,
  TransferRequest,
  WithdrawRequest,
} from "@/lib/types";
import {
  mockGetTransactions,
  mockCreateDeposit,
  mockCreateWithdraw,
  mockCreateTransfer,
} from "../mocks/transaction";

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

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepositRequest) => mockCreateDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawRequest) => mockCreateWithdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferRequest) => mockCreateTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

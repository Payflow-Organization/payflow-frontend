"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  DepositRequest,
  TransferRequest,
  WithdrawRequest,
} from "@/lib/types";
import {
  createDeposit,
  createTransfer,
  createWithdraw,
  getTransactions,
} from "../api/transaction";

export function useTransactions(page: number) {
  return useQuery({
    queryKey: ["transactions", page],
    queryFn: () => getTransactions(page, 20),
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<DepositRequest, "idempotencyKey">) =>
      createDeposit({ ...data, idempotencyKey: crypto.randomUUID() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<WithdrawRequest, "idempotencyKey">) =>
      createWithdraw({ ...data, idempotencyKey: crypto.randomUUID() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<TransferRequest, "idempotencyKey">) =>
      createTransfer({ ...data, idempotencyKey: crypto.randomUUID() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

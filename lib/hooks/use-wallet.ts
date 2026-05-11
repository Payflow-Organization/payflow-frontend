"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWallet, freezeWallet, getWallet, getWallets } from "@/lib/api/wallets";
import type { CreateWalletRequest } from "@/lib/types";

export function useWallets() {
  return useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
  });
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: ["wallets", id],
    queryFn: () => getWallet(id),
    enabled: !!id,
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWalletRequest) => createWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
}

export function useFreezeWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => freezeWallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
}

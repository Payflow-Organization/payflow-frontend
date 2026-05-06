import client from "./client";
import type {
  Wallet,
  BalanceResponse,
  TransactionView,
  CreateWalletRequest,
  PaginatedResponse,
} from "@/lib/types";

export async function getWallets(): Promise<Wallet[]> {
  const res = await client.get<Wallet[]>("/wallets");
  return res.data;
}

export async function getBalance(walletId: string): Promise<BalanceResponse> {
  const res = await client.get<BalanceResponse>(`/wallets/${walletId}/balance`);
  return res.data;
}

export async function createWallet(data: CreateWalletRequest): Promise<Wallet> {
  const res = await client.post<Wallet>("/wallets", data);
  return res.data;
}

export async function getWalletStatement(
  id: string,
  from: string,
  to: string,
): Promise<PaginatedResponse<TransactionView>> {
  const res = await client.get<PaginatedResponse<TransactionView>>(
    `/wallets/${id}/statement?from=${from}&to=${to}`,
  );
  return res.data;
}

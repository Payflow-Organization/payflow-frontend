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

export async function getWallet(id: string): Promise<Wallet> {
  const res = await client.get<Wallet>(`/wallets/${id}`);
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

export async function freezeWallet(id: string): Promise<void> {
  await client.post(`/wallets/${id}/freeze`);
}

export async function unfreezeWallet(id: string): Promise<void> {
  await client.post(`/wallets/${id}/unfreeze`);
}

export async function getWalletStatement(
  id: string,
  from: string,
  to: string,
): Promise<PaginatedResponse<TransactionView>> {
  const params = new URLSearchParams({ from, to });
  const res = await client.get<PaginatedResponse<TransactionView>>(
    `/wallets/${id}/statement?${params.toString()}`,
  );
  return res.data;
}

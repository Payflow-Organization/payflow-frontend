import client from "./client";
import type {
  Transaction,
  DepositRequest,
  WithdrawRequest,
  TransferRequest,
  PaginatedResponse,
} from "@/lib/types";

export async function getTransactions(
  walletId: string | undefined,
  params: { page: number; size: number; type?: string; status?: string },
): Promise<PaginatedResponse<Transaction>> {
  const query = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });
  if (walletId) query.set("walletId", walletId);
  if (params.type) query.set("type", params.type);
  if (params.status) query.set("status", params.status);

  const res = await client.get<PaginatedResponse<Transaction>>(
    `/transactions?${query}`,
  );
  return res.data;
}

export async function createDeposit(
  data: DepositRequest,
): Promise<Transaction> {
  const res = await client.post<Transaction>("/transactions/deposit", data);
  return res.data;
}

export async function createWithdraw(
  data: WithdrawRequest,
): Promise<Transaction> {
  const res = await client.post<Transaction>("/transactions/withdraw", data);
  return res.data;
}

export async function createTransfer(
  data: TransferRequest,
): Promise<Transaction> {
  const res = await client.post<Transaction>("/transactions/transfer", data);
  return res.data;
}

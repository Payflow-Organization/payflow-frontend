import client from "./client";
import type {
  Transaction,
  DepositRequest,
  WithdrawRequest,
  TransferRequest,
  PaginatedResponse,
} from "@/lib/types";

export async function getTransactions(
  page: number,
  size: number,
): Promise<PaginatedResponse<Transaction>> {
  const res = await client.get<PaginatedResponse<Transaction>>(
    `/transactions?page=${page}&size=${size}`,
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

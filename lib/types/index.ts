export type WalletStatus = "ACTIVE" | "FROZEN" | "SUSPENDED" | "CLOSED";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";
export type TransactionType = "DEPOSIT" | "WITHDRAW" | "TRANSFER";
export type EntryType = "DEBIT" | "CREDIT";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

export interface Wallet {
  id: string;
  currency: string; // "GBP" | "EUR" | "USD" — Java Currency serialises to its code
  balance: number; // cents — divide by 100 to display
  status: WalletStatus;
  createdAt: string; // ISO 8601
}

export interface BalanceResponse {
  walletId: string;
  balanceCents: number;
  currency: string;
}

export interface Transaction {
  id: string;
  fromWalletId: string | null; // null for DEPOSIT
  toWalletId: string | null; // null for WITHDRAW
  type: TransactionType;
  amount: number; // cents
  currency: string;
  status: TransactionStatus;
  createdAt: string;
}
export interface TransactionView {
  // wallet statement entries
  transactionId: string;
  createdAt: string;
  entryType: EntryType;
  amount: number; // cents
  balanceAfter: number; // cents
}

export interface BalanceHistoryPoint {
  interval: string; // ISO 8601
  lastBalanceCents: number;
}

export interface MonthlySummary {
  totalDepositsCents: number;
  totalWithdrawalsCents: number;
  netCents: number;
  transactionCount: number;
}

export interface SpendingByCategory {
  transactionType: string;
  totalCents: number;
  count: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-indexed)
  size: number;
}
export interface LoginRequest {
  email: string;
  password: string; // min 8 chars
}

export interface RegisterRequest {
  email: string;
  password: string; // min 8 chars
  fullName: string;
}

export interface DepositRequest {
  toWalletId: string;
  amount: number; // cents
  currency: string;
  idempotencyKey: string;
}

export interface WithdrawRequest {
  fromWalletId: string;
  amount: number; // cents
  currency: string;
  idempotencyKey: string;
}

export interface TransferRequest {
  fromWalletId: string;
  toWalletId: string;
  amount: number; // cents
  currency: string;
  idempotencyKey: string;
}

export interface CreateWalletRequest {
  currency: string;
}

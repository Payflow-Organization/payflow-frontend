import { analyticsHandlers } from "./scenarios/analytics";
import { authErrorHandlers, authHandlers } from "./scenarios/auth";
import { walletHandlers } from "./scenarios/wallets";

export const handlers = [
  ...authHandlers,
  ...walletHandlers,
  ...analyticsHandlers,
];

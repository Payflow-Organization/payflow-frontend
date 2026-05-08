// mocks/scenarios/wallets.ts
import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";
import type { Wallet } from "@/lib/types";

const CURRENCIES = ["GBP", "EUR", "USD"];

const mockWallet = (currency?: string): Wallet => ({
  id: faker.string.uuid(),
  currency: currency ?? faker.helpers.arrayElement(CURRENCIES),
  balance: faker.number.int({ min: 1000, max: 1000000 }),
  status: "ACTIVE",
  createdAt: faker.date.past().toISOString(),
});

const wallets: Wallet[] = [
  mockWallet("GBP"),
  mockWallet("EUR"),
  mockWallet("USD"),
];

export const walletHandlers = [
  http.get("/api/v1/wallets", () => HttpResponse.json(wallets)),

  http.get("/api/v1/wallets/:id", ({ params }) => {
    const wallet = wallets.find((w) => w.id === params.id);
    if (!wallet) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(wallet);
  }),

  http.get("/api/v1/wallets/:id/balance", ({ params }) => {
    const wallet = wallets.find((w) => w.id === params.id);
    if (!wallet) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      walletId: wallet.id,
      balanceCents: wallet.balance,
      currency: wallet.currency,
    });
  }),

  http.post("/api/v1/wallets", async ({ request }) => {
    const body = (await request.json()) as { currency: string };
    const newWallet = mockWallet(body.currency);
    wallets.push(newWallet);
    return HttpResponse.json(newWallet, { status: 201 });
  }),
];
